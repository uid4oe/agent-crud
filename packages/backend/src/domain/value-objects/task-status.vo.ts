export const TaskStatusValues = ["pending", "in_progress", "completed"] as const;

export type TaskStatus = (typeof TaskStatusValues)[number];

export function isValidTaskStatus(value: string): value is TaskStatus {
  return TaskStatusValues.includes(value as TaskStatus);
}
