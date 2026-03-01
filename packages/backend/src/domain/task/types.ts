// ============================================
// Value Object
// ============================================

export const TaskStatusValues = ["pending", "in_progress", "completed"] as const;

export type TaskStatus = (typeof TaskStatusValues)[number];

export const TaskPriorityValues = ["low", "normal", "high"] as const;

export type TaskPriority = (typeof TaskPriorityValues)[number];

// ============================================
// Entity Props
// ============================================

export interface TaskProps {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskProps {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
}

export interface UpdateTaskProps {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
}

// ============================================
// Service Input/Output
// ============================================

export interface ListTasksInput {
  status?: TaskStatus;
}

export interface GetTaskInput {
  id: string;
}

export type CreateTaskInput = CreateTaskProps;

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
}

export interface DeleteTaskInput {
  id: string;
}
