/**
 * Express Application Setup
 *
 * Configures Express with:
 * - CORS middleware
 * - Request logging
 * - Rate limiting
 * - Health checks
 * - tRPC router
 * - Error handling
 */

import type { Express } from "express";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { router, createTaskRouter, createNoteRouter, createGoalRouter, createAgentRouter } from "./index.js";
import type { Container } from "../config/types.js";
import { createRequestLoggerMiddleware, RateLimiter, RateLimitPresets } from "../middleware/index.js";
import { createErrorHandlerMiddleware } from "../middleware/index.js";

export function createApp(container: Container): {
  app: Express;
  appRouter: ReturnType<typeof createAppRouter>;
} {
  const app = express();

  // ============================================
  // Core Middleware
  // ============================================

  // CORS - handle wildcard specially
  const corsOrigins = container.config.server.corsOrigins;
  app.use(
    cors({
      origin: corsOrigins.includes("*") ? true : corsOrigins,
      credentials: true,
    })
  );

  // Request logging
  app.use(createRequestLoggerMiddleware(container.logger));

  // Rate limiting (applied to API routes)
  if (container.config.rateLimit.enabled) {
    // Stricter rate limit for AI agent routes
    const aiRateLimiter = new RateLimiter({
      ...RateLimitPresets.ai(),
      enabled: true,
    });
    app.use("/trpc/agent.chat", aiRateLimiter.middleware());
    app.use("/trpc/agent.chatStream", aiRateLimiter.middleware());
    // Standard rate limit for other tRPC routes
    app.use("/trpc", container.rateLimiter.middleware());
  }

  // ============================================
  // Health Check Routes
  // ============================================

  app.use(container.healthCheckRegistry.createRouter());

  // ============================================
  // API Routes
  // ============================================

  const taskRouter = createTaskRouter(container.taskService);
  const noteRouter = createNoteRouter(container.noteService);
  const goalRouter = createGoalRouter(container.goalService);
  const agentRouter = createAgentRouter(container.conversationService);
  const appRouter = createAppRouter(taskRouter, noteRouter, goalRouter, agentRouter);

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
    })
  );

  // ============================================
  // Error Handling
  // ============================================

  app.use(createErrorHandlerMiddleware(container.logger));

  return { app, appRouter };
}

function createAppRouter(
  taskRouter: ReturnType<typeof createTaskRouter>,
  noteRouter: ReturnType<typeof createNoteRouter>,
  goalRouter: ReturnType<typeof createGoalRouter>,
  agentRouter: ReturnType<typeof createAgentRouter>
) {
  return router({
    task: taskRouter,
    note: noteRouter,
    goal: goalRouter,
    agent: agentRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
