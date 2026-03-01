/**
 * Application Entry Point
 *
 * Initializes the application with:
 * - Configuration loading
 * - Dependency injection container
 * - Express application
 * - WebSocket server for tRPC subscriptions
 * - Graceful shutdown handling
 */

import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { shutdownLangfuse } from "./infrastructure/adapters/observability/index.js";
import { getConfig } from "./infrastructure/config/config.js";
import { createContainer } from "./infrastructure/config/container.js";
import { createApp } from "./infrastructure/endpoints/app.js";

export type { AppRouter } from "./infrastructure/endpoints/app.js";

async function start() {
  // Load and validate configuration
  const config = getConfig();

  // Create dependency injection container
  const container = createContainer(config);
  const { logger } = container;

  // Create Express application
  const { app, appRouter } = createApp(container);

  // Start HTTP server
  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info("Server started", {
      url: `http://${config.server.host}:${config.server.port}`,
      env: config.env,
      healthCheck: `http://${config.server.host}:${config.server.port}/health`,
    });
  });

  // Create WebSocket server for tRPC subscriptions (shares HTTP server)
  const wss = new WebSocketServer({ server });
  const wssHandler = applyWSSHandler({
    wss,
    router: appRouter,
  });

  logger.info("WebSocket server started for tRPC subscriptions");

  // Graceful shutdown handler
  async function shutdown(signal: string) {
    logger.info("Shutdown signal received", { signal });

    // Close WebSocket connections
    wssHandler.broadcastReconnectNotification();
    wss.close();

    // Stop accepting new connections
    server.close(async () => {
      logger.info("HTTP server closed");

      try {
        // Shutdown container (rate limiter, etc.)
        await container.shutdown();

        // Flush observability data
        await shutdownLangfuse();

        logger.info("Graceful shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", error as Error);
        process.exit(1);
      }
    });

    // Force exit after timeout
    setTimeout(() => {
      logger.warn("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  }

  // Register shutdown handlers
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", error);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", reason as Error);
  });
}

start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
