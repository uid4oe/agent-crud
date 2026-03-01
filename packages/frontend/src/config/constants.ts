import type { TaskStatus, TaskPriority, NoteCategory, GoalStatus, GoalCategory } from "../types";

export const APP_NAME = "TaskAI";

export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  CHAT_CONVERSATION: "/chat/:conversationId",
  TASKS: "/tasks",
  NOTES: "/notes",
  WELLNESS: "/wellness",
} as const;

export const TASK_STATUSES: Record<Uppercase<TaskStatus>, TaskStatus> = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUSES.PENDING, label: "Pending" },
  { value: TASK_STATUSES.IN_PROGRESS, label: "In Progress" },
  { value: TASK_STATUSES.COMPLETED, label: "Completed" },
] as const;

export const TASK_PRIORITIES: Record<Uppercase<TaskPriority>, TaskPriority> = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
} as const;

export const TASK_PRIORITY_OPTIONS = [
  { value: TASK_PRIORITIES.LOW, label: "Low" },
  { value: TASK_PRIORITIES.NORMAL, label: "Normal" },
  { value: TASK_PRIORITIES.HIGH, label: "High" },
] as const;

export const NOTE_CATEGORIES: Record<Uppercase<NoteCategory>, NoteCategory> = {
  GENERAL: "general",
  IDEA: "idea",
  REFERENCE: "reference",
  MEETING: "meeting",
  PERSONAL: "personal",
} as const;

export const NOTE_CATEGORY_OPTIONS = [
  { value: NOTE_CATEGORIES.GENERAL, label: "General" },
  { value: NOTE_CATEGORIES.IDEA, label: "Idea" },
  { value: NOTE_CATEGORIES.REFERENCE, label: "Reference" },
  { value: NOTE_CATEGORIES.MEETING, label: "Meeting" },
  { value: NOTE_CATEGORIES.PERSONAL, label: "Personal" },
] as const;

export const GOAL_STATUSES: Record<Uppercase<GoalStatus>, GoalStatus> = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const;

export const GOAL_STATUS_OPTIONS = [
  { value: GOAL_STATUSES.ACTIVE, label: "Active" },
  { value: GOAL_STATUSES.COMPLETED, label: "Completed" },
  { value: GOAL_STATUSES.ABANDONED, label: "Abandoned" },
] as const;

export const GOAL_CATEGORIES: Record<Uppercase<GoalCategory>, GoalCategory> = {
  FITNESS: "fitness",
  NUTRITION: "nutrition",
  MINDFULNESS: "mindfulness",
  SLEEP: "sleep",
  OTHER: "other",
} as const;

export const GOAL_CATEGORY_OPTIONS = [
  { value: GOAL_CATEGORIES.FITNESS, label: "Fitness" },
  { value: GOAL_CATEGORIES.NUTRITION, label: "Nutrition" },
  { value: GOAL_CATEGORIES.MINDFULNESS, label: "Mindfulness" },
  { value: GOAL_CATEGORIES.SLEEP, label: "Sleep" },
  { value: GOAL_CATEGORIES.OTHER, label: "Other" },
] as const;
