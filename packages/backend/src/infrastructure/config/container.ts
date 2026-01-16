// Domain
import {
  TaskRepositoryPort,
  ConversationRepositoryPort,
  MessageRepositoryPort,
  AiAgentPort,
  ListTasksService,
  GetTaskService,
  CreateTaskService,
  UpdateTaskService,
  DeleteTaskService,
  CreateConversationService,
  GetConversationService,
  ListConversationsService,
  DeleteConversationService,
  GetMessagesService,
  ChatService,
} from "../../domain/index.js";

// Adapters
import {
  DrizzleTaskRepository,
  DrizzleConversationRepository,
  DrizzleMessageRepository,
} from "../adapters/persistence/drizzle/index.js";
import { GeminiAgentAdapter } from "../adapters/ai/gemini/index.js";
import { TaskToolExecutor } from "../adapters/ai/tools/index.js";
import { taskToolsDefinition } from "../adapters/ai/tools/index.js";
import { TASK_AGENT_SYSTEM_PROMPT } from "../adapters/ai/prompts/index.js";

export interface Container {
  // Repositories
  taskRepository: TaskRepositoryPort;
  conversationRepository: ConversationRepositoryPort;
  messageRepository: MessageRepositoryPort;

  // AI
  aiAgent: AiAgentPort;

  // Task Services
  listTasksService: ListTasksService;
  getTaskService: GetTaskService;
  createTaskService: CreateTaskService;
  updateTaskService: UpdateTaskService;
  deleteTaskService: DeleteTaskService;

  // Conversation Services
  createConversationService: CreateConversationService;
  getConversationService: GetConversationService;
  listConversationsService: ListConversationsService;
  deleteConversationService: DeleteConversationService;
  getMessagesService: GetMessagesService;
  chatService: ChatService;
}

export function createContainer(): Container {
  // Adapters - Repositories
  const taskRepository = new DrizzleTaskRepository();
  const conversationRepository = new DrizzleConversationRepository();
  const messageRepository = new DrizzleMessageRepository();

  // Adapters - AI
  const toolExecutor = new TaskToolExecutor(taskRepository);
  const aiAgent = new GeminiAgentAdapter(
    {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      systemPrompt: TASK_AGENT_SYSTEM_PROMPT,
      tools: taskToolsDefinition,
    },
    toolExecutor
  );

  // Task Services
  const listTasksService = new ListTasksService(taskRepository);
  const getTaskService = new GetTaskService(taskRepository);
  const createTaskService = new CreateTaskService(taskRepository);
  const updateTaskService = new UpdateTaskService(taskRepository);
  const deleteTaskService = new DeleteTaskService(taskRepository);

  // Conversation Services
  const createConversationService = new CreateConversationService(conversationRepository);
  const getConversationService = new GetConversationService(conversationRepository);
  const listConversationsService = new ListConversationsService(conversationRepository);
  const deleteConversationService = new DeleteConversationService(conversationRepository);
  const getMessagesService = new GetMessagesService(messageRepository);
  const chatService = new ChatService(messageRepository, conversationRepository, aiAgent);

  return {
    taskRepository,
    conversationRepository,
    messageRepository,
    aiAgent,
    listTasksService,
    getTaskService,
    createTaskService,
    updateTaskService,
    deleteTaskService,
    createConversationService,
    getConversationService,
    listConversationsService,
    deleteConversationService,
    getMessagesService,
    chatService,
  };
}
