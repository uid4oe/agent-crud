import { z } from "zod";
import type { GoalStatus, GoalCategory } from "../../types";
import { GOAL_STATUSES, GOAL_CATEGORIES } from "../../config";

const GOAL_STATUS_VALUES = Object.values(GOAL_STATUSES) as [GoalStatus, ...GoalStatus[]];
const GOAL_CATEGORY_VALUES = Object.values(GOAL_CATEGORIES) as [GoalCategory, ...GoalCategory[]];

export const milestoneFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Milestone title is required"),
  completed: z.boolean().optional(),
});

export const goalFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2,000 characters or less"),
  status: z.enum(GOAL_STATUS_VALUES),
  category: z.enum(GOAL_CATEGORY_VALUES),
  targetDate: z.string(),
  milestones: z.array(milestoneFormSchema),
});

export type GoalFormSchema = z.infer<typeof goalFormSchema>;
