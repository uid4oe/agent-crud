import { loadEnv } from "./infrastructure/config/bootstrap.js";
loadEnv();

import { createContainer } from "./infrastructure/config/container.js";
import { createApp } from "./infrastructure/endpoints/app.js";
import { shutdownLangfuse } from "./infrastructure/adapters/observability/index.js";

export type { AppRouter } from "./infrastructure/endpoints/app.js";

function start() {
  const container = createContainer();
  const { app } = createApp(container);

  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  async function shutdown(signal: string) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await shutdownLangfuse();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
