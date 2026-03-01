// ============================================
// Error Types
// ============================================

export type ErrorCode =
  // Generic errors
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  // Task errors
  | "TASK_NOT_FOUND"
  | "TASK_INVALID_STATUS"
  | "TASK_TITLE_REQUIRED"
  // Note errors
  | "NOTE_NOT_FOUND"
  | "NOTE_INVALID_CATEGORY"
  | "NOTE_TITLE_REQUIRED"
  // Goal errors
  | "GOAL_NOT_FOUND"
  | "GOAL_INVALID_STATUS"
  | "GOAL_INVALID_CATEGORY"
  | "GOAL_TITLE_REQUIRED"
  // Conversation errors
  | "CONVERSATION_NOT_FOUND"
  | "MESSAGE_NOT_FOUND"
  | "MESSAGE_NOT_EDITABLE"
  | "MESSAGE_CONTENT_REQUIRED"
  // AI errors
  | "AI_SERVICE_ERROR"
  | "AI_RATE_LIMITED"
  | "AI_INVALID_RESPONSE"
  // Database errors
  | "DATABASE_ERROR"
  | "DATABASE_CONNECTION_ERROR";

export interface SerializedError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationInput {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// AI Port Types
// ============================================

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface HistoryMessage {
  role: string;
  content: string;
}

export interface AiAgentPort {
  chat(sessionId: string, userMessage: string, history?: HistoryMessage[]): Promise<string>;
  chatStream(
    sessionId: string,
    userMessage: string,
    history?: HistoryMessage[]
  ): AsyncGenerator<StreamChunk, void, unknown>;
  generateTitle(userMessage: string, aiResponse: string): Promise<string>;
  summarizeConversation(messages: string): Promise<string>;
}
