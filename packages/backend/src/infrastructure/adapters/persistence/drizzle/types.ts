import type { conversations, goals, messages, milestones, notes, tasks } from "./schema.js";

export type TaskRecord = typeof tasks.$inferSelect;
export type NewTaskRecord = typeof tasks.$inferInsert;

export type ConversationRecord = typeof conversations.$inferSelect;
export type NewConversationRecord = typeof conversations.$inferInsert;
export type MessageRecord = typeof messages.$inferSelect;
export type NewMessageRecord = typeof messages.$inferInsert;

export type NoteRecord = typeof notes.$inferSelect;
export type NewNoteRecord = typeof notes.$inferInsert;

export type GoalRecord = typeof goals.$inferSelect;
export type NewGoalRecord = typeof goals.$inferInsert;
export type MilestoneRecord = typeof milestones.$inferSelect;
export type NewMilestoneRecord = typeof milestones.$inferInsert;
