export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory = "general" | "idea" | "reference" | "meeting" | "personal";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export type GoalStatus = "active" | "completed" | "abandoned";

export type GoalCategory = "fitness" | "nutrition" | "mindfulness" | "sleep" | "other";

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  category: GoalCategory;
  targetDate: string | null;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}
