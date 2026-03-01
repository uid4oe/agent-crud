export { createDbClient, type DbClient } from "./client.js";
export * from "./schema.js";
export type {
  TaskRecord,
  NewTaskRecord,
  ConversationRecord,
  NewConversationRecord,
  MessageRecord,
  NewMessageRecord,
  NoteRecord,
  NewNoteRecord,
  GoalRecord,
  NewGoalRecord,
  MilestoneRecord,
  NewMilestoneRecord,
} from "./types.js";
export { DrizzleTaskRepository } from "./task.repository.js";
export { DrizzleConversationRepository } from "./conversation.repository.js";
export { DrizzleMessageRepository } from "./message.repository.js";
export { DrizzleNoteRepository } from "./note.repository.js";
export { DrizzleGoalRepository } from "./goal.repository.js";
