import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "normal",
  "high",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: taskPriorityEnum("priority").notNull().default("normal"),
  dueDate: timestamp("due_date"),
  tags: jsonb("tags").notNull().default([]).$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("tasks_status_idx").on(table.status),
  updatedAtIdx: index("tasks_updated_at_idx").on(table.updatedAt),
  priorityIdx: index("tasks_priority_idx").on(table.priority),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
  createdAtIdx: index("tasks_created_at_idx").on(table.createdAt),
}));

// Agent conversation schema
export const messageRoleEnum = pgEnum("message_role", ["user", "model"]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  updatedAtIdx: index("conversations_updated_at_idx").on(table.updatedAt),
  createdAtIdx: index("conversations_created_at_idx").on(table.createdAt),
}));

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationCreatedIdx: index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
}));

// Notes schema
export const noteCategoryEnum = pgEnum("note_category", [
  "general",
  "idea",
  "reference",
  "meeting",
  "personal",
]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  category: noteCategoryEnum("category").notNull().default("general"),
  tags: jsonb("tags").notNull().default([]).$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("notes_category_idx").on(table.category),
  updatedAtIdx: index("notes_updated_at_idx").on(table.updatedAt),
  createdAtIdx: index("notes_created_at_idx").on(table.createdAt),
}));

// Goals schema
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "abandoned",
]);

export const goalCategoryEnum = pgEnum("goal_category", [
  "fitness",
  "nutrition",
  "mindfulness",
  "sleep",
  "other",
]);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: goalStatusEnum("status").notNull().default("active"),
  category: goalCategoryEnum("category").notNull().default("other"),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("goals_status_idx").on(table.status),
  categoryIdx: index("goals_category_idx").on(table.category),
  targetDateIdx: index("goals_target_date_idx").on(table.targetDate),
  updatedAtIdx: index("goals_updated_at_idx").on(table.updatedAt),
  createdAtIdx: index("goals_created_at_idx").on(table.createdAt),
}));

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  goalIdIdx: index("milestones_goal_id_idx").on(table.goalId),
}));
