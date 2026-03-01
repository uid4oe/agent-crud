import type { z } from "zod";
import type {
  AiAgentPort,
  ConversationRepositoryPort,
  ConversationService,
  GoalRepositoryPort,
  GoalService,
  MessageRepositoryPort,
  NoteRepositoryPort,
  NoteService,
  TaskRepositoryPort,
  TaskService,
} from "../../domain/index.js";
import type { DbClient } from "../adapters/persistence/drizzle/client.js";
import type { HealthCheckRegistry } from "../health/index.js";
import type { Logger } from "../logging/logger.js";
import type { RateLimiter } from "../middleware/rate-limiter.middleware.js";
import type { configSchema } from "./config.js";

export type Environment = "development" | "production" | "test";

export type Config = z.infer<typeof configSchema>;

export interface Container {
  config: Config;
  logger: Logger;
  db: DbClient;
  rateLimiter: RateLimiter;
  healthCheckRegistry: HealthCheckRegistry;
  taskRepository: TaskRepositoryPort;
  conversationRepository: ConversationRepositoryPort;
  messageRepository: MessageRepositoryPort;
  noteRepository: NoteRepositoryPort;
  goalRepository: GoalRepositoryPort;
  aiAgent: AiAgentPort;
  taskService: TaskService;
  noteService: NoteService;
  goalService: GoalService;
  conversationService: ConversationService;
  shutdown(): Promise<void>;
}
