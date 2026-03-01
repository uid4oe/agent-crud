import {
  TaskService,
  NoteService,
  GoalService,
  ConversationService,
} from "../../domain/index.js";

import {
  DrizzleTaskRepository,
  DrizzleConversationRepository,
  DrizzleMessageRepository,
  DrizzleNoteRepository,
  DrizzleGoalRepository,
  createDbClient,
} from "../adapters/persistence/drizzle/index.js";
import { AdkAgentAdapter } from "../adapters/ai/adk-agent.adapter.js";

import { createLogger } from "../logging/index.js";
import { RateLimiter, RateLimitPresets } from "../middleware/index.js";
import {
  HealthCheckRegistry,
  createDatabaseHealthCheck,
  createMemoryHealthCheck,
  createAiHealthCheck,
} from "../health/index.js";
import type { Config, Container } from "./types.js";

export function createContainer(config: Config): Container {
  const logger = createLogger({
    level: config.logging.level,
    format: config.logging.format,
    enabled: true,
  });

  logger.info("Initializing container", {
    env: config.env,
    port: config.server.port,
  });

  const db = createDbClient(config.database.url);

  const rateLimiter = new RateLimiter({
    ...RateLimitPresets.standard(),
    enabled: config.rateLimit.enabled,
    windowMs: config.rateLimit.windowMs,
    maxRequests: config.rateLimit.maxRequests,
  });

  const healthCheckRegistry = new HealthCheckRegistry(logger, "1.0.0");
  healthCheckRegistry.register("database", createDatabaseHealthCheck(db));
  healthCheckRegistry.register("memory", createMemoryHealthCheck(500));
  healthCheckRegistry.register("ai", createAiHealthCheck(config.gemini.apiKey, config.gemini.model));

  const taskRepository = new DrizzleTaskRepository(db);
  const conversationRepository = new DrizzleConversationRepository(db);
  const messageRepository = new DrizzleMessageRepository(db);
  const noteRepository = new DrizzleNoteRepository(db);
  const goalRepository = new DrizzleGoalRepository(db);

  const aiAgent = new AdkAgentAdapter(
    {
      taskRepository,
      noteRepository,
      goalRepository,
      model: config.gemini.model,
      routerModel: config.gemini.routerModel,
      apiKey: config.gemini.apiKey,
    },
    logger
  );

  const taskService = new TaskService(taskRepository);
  const noteService = new NoteService(noteRepository);
  const goalService = new GoalService(goalRepository);
  const conversationService = new ConversationService(
    conversationRepository,
    messageRepository,
    aiAgent
  );

  async function shutdown(): Promise<void> {
    logger.info("Shutting down container...");
    rateLimiter.destroy();
    logger.info("Container shutdown complete");
  }

  return {
    config,
    logger,
    db,
    rateLimiter,
    healthCheckRegistry,
    taskRepository,
    conversationRepository,
    messageRepository,
    noteRepository,
    goalRepository,
    aiAgent,
    taskService,
    noteService,
    goalService,
    conversationService,
    shutdown,
  };
}
