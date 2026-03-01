import type { ErrorCode, SerializedError } from "../types.js";

const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  INTERNAL_ERROR: 500,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TASK_NOT_FOUND: 404,
  TASK_INVALID_STATUS: 400,
  TASK_TITLE_REQUIRED: 400,
  NOTE_NOT_FOUND: 404,
  NOTE_INVALID_CATEGORY: 400,
  NOTE_TITLE_REQUIRED: 400,
  GOAL_NOT_FOUND: 404,
  GOAL_INVALID_STATUS: 400,
  GOAL_INVALID_CATEGORY: 400,
  GOAL_TITLE_REQUIRED: 400,
  CONVERSATION_NOT_FOUND: 404,
  MESSAGE_NOT_FOUND: 404,
  MESSAGE_NOT_EDITABLE: 400,
  MESSAGE_CONTENT_REQUIRED: 400,
  AI_SERVICE_ERROR: 503,
  AI_RATE_LIMITED: 429,
  AI_INVALID_RESPONSE: 502,
  DATABASE_ERROR: 500,
  DATABASE_CONNECTION_ERROR: 503,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code];
    this.details = details;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): SerializedError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
    };
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super("NOT_FOUND", message, { resource, id });
    this.name = "NotFoundError";
  }
}

export class TaskNotFoundError extends AppError {
  constructor(id: string) {
    super("TASK_NOT_FOUND", `Task with id '${id}' not found`, { taskId: id });
    this.name = "TaskNotFoundError";
  }
}

export class ConversationNotFoundError extends AppError {
  constructor(id: string) {
    super("CONVERSATION_NOT_FOUND", `Conversation with id '${id}' not found`, {
      conversationId: id,
    });
    this.name = "ConversationNotFoundError";
  }
}

export class NoteNotFoundError extends AppError {
  constructor(id: string) {
    super("NOTE_NOT_FOUND", `Note with id '${id}' not found`, { noteId: id });
    this.name = "NoteNotFoundError";
  }
}

export class NoteInvalidCategoryError extends AppError {
  constructor(category: string) {
    super("NOTE_INVALID_CATEGORY", `Invalid note category: ${category}`, { category });
    this.name = "NoteInvalidCategoryError";
  }
}

export class NoteTitleRequiredError extends AppError {
  constructor() {
    super("NOTE_TITLE_REQUIRED", "Note title cannot be empty");
    this.name = "NoteTitleRequiredError";
  }
}

export class GoalNotFoundError extends AppError {
  constructor(id: string) {
    super("GOAL_NOT_FOUND", `Goal with id '${id}' not found`, { goalId: id });
    this.name = "GoalNotFoundError";
  }
}

export class GoalInvalidStatusError extends AppError {
  constructor(status: string) {
    super("GOAL_INVALID_STATUS", `Invalid goal status: ${status}`, { status });
    this.name = "GoalInvalidStatusError";
  }
}

export class GoalInvalidCategoryError extends AppError {
  constructor(category: string) {
    super("GOAL_INVALID_CATEGORY", `Invalid goal category: ${category}`, { category });
    this.name = "GoalInvalidCategoryError";
  }
}

export class GoalTitleRequiredError extends AppError {
  constructor() {
    super("GOAL_TITLE_REQUIRED", "Goal title cannot be empty");
    this.name = "GoalTitleRequiredError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class TaskTitleRequiredError extends AppError {
  constructor() {
    super("TASK_TITLE_REQUIRED", "Task title cannot be empty");
    this.name = "TaskTitleRequiredError";
  }
}

export class TaskInvalidStatusError extends AppError {
  constructor(status: string) {
    super("TASK_INVALID_STATUS", `Invalid task status: ${status}`, { status });
    this.name = "TaskInvalidStatusError";
  }
}

export class MessageNotFoundError extends AppError {
  constructor(id: string) {
    super("MESSAGE_NOT_FOUND", `Message with id '${id}' not found`, { messageId: id });
    this.name = "MessageNotFoundError";
  }
}

export class MessageNotEditableError extends AppError {
  constructor(id: string, reason: string = "Only user messages can be edited") {
    super("MESSAGE_NOT_EDITABLE", reason, { messageId: id });
    this.name = "MessageNotEditableError";
  }
}

export class MessageContentRequiredError extends AppError {
  constructor() {
    super("MESSAGE_CONTENT_REQUIRED", "Message content cannot be empty");
    this.name = "MessageContentRequiredError";
  }
}

export class AiServiceError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("AI_SERVICE_ERROR", message, details);
    this.name = "AiServiceError";
  }
}

export class AiRateLimitedError extends AppError {
  constructor(retryAfter?: number) {
    super("AI_RATE_LIMITED", "AI service rate limited", { retryAfter });
    this.name = "AiRateLimitedError";
  }
}

export class AiInvalidResponseError extends AppError {
  constructor(message: string) {
    super("AI_INVALID_RESPONSE", message);
    this.name = "AiInvalidResponseError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("DATABASE_ERROR", message, details);
    this.name = "DatabaseError";
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string = "Failed to connect to database") {
    super("DATABASE_CONNECTION_ERROR", message);
    this.name = "DatabaseConnectionError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super("UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICT", message, details);
    this.name = "ConflictError";
  }
}

export class InternalError extends AppError {
  constructor(message: string = "Internal server error") {
    super("INTERNAL_ERROR", message);
    this.name = "InternalError";
  }
}

export function wrapError(error: unknown): AppError {
  if (AppError.isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", error.message, {
      originalName: error.name,
    });
  }

  return new AppError("INTERNAL_ERROR", "An unknown error occurred");
}
