import { z } from "zod";
import { TASK_STATUSES, TASK_PRIORITIES } from "../../config";

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less"),
  status: z.enum([
    TASK_STATUSES.PENDING,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.COMPLETED,
  ]),
  priority: z.enum([
    TASK_PRIORITIES.LOW,
    TASK_PRIORITIES.NORMAL,
    TASK_PRIORITIES.HIGH,
  ]),
  dueDate: z.string().optional(),
  tags: z.string(),
});

export type TaskFormSchema = z.infer<typeof taskFormSchema>;
