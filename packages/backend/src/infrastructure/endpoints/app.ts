import express, { Express } from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { router, createTaskRouter, createAgentRouter } from "./index.js";
import { Container } from "../config/container.js";

export function createApp(container: Container): { app: Express; appRouter: ReturnType<typeof createAppRouter> } {
  const app = express();

  app.use(cors());

  const taskRouter = createTaskRouter(
    container.listTasksService,
    container.getTaskService,
    container.createTaskService,
    container.updateTaskService,
    container.deleteTaskService
  );

  const agentRouter = createAgentRouter(
    container.createConversationService,
    container.getConversationService,
    container.listConversationsService,
    container.deleteConversationService,
    container.getMessagesService,
    container.chatService
  );

  const appRouter = createAppRouter(taskRouter, agentRouter);

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
    })
  );

  return { app, appRouter };
}

function createAppRouter(
  taskRouter: ReturnType<typeof createTaskRouter>,
  agentRouter: ReturnType<typeof createAgentRouter>
) {
  return router({
    task: taskRouter,
    agent: agentRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
export type { Container };
