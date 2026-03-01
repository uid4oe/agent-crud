// ============================================
// Value Objects
// ============================================

export const GoalStatusValues = ["active", "completed", "abandoned"] as const;

export type GoalStatus = (typeof GoalStatusValues)[number];

export const GoalCategoryValues = [
  "fitness",
  "nutrition",
  "mindfulness",
  "sleep",
  "other",
] as const;

export type GoalCategory = (typeof GoalCategoryValues)[number];

// ============================================
// Milestone Props
// ============================================

export interface MilestoneProps {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface CreateMilestoneProps {
  id?: string;
  title: string;
  completed?: boolean;
  sortOrder?: number;
}

// ============================================
// Entity Props
// ============================================

export interface GoalProps {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  category: GoalCategory;
  targetDate: Date | null;
  milestones: MilestoneProps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalProps {
  title: string;
  description?: string | null;
  status?: GoalStatus;
  category?: GoalCategory;
  targetDate?: Date | null;
  milestones?: CreateMilestoneProps[];
}

export interface UpdateGoalProps {
  title?: string;
  description?: string | null;
  status?: GoalStatus;
  category?: GoalCategory;
  targetDate?: Date | null;
  milestones?: CreateMilestoneProps[];
}

// ============================================
// Service Input/Output
// ============================================

export interface ListGoalsInput {
  status?: GoalStatus;
  category?: GoalCategory;
}

export interface GetGoalInput {
  id: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string | null;
  status?: GoalStatus;
  category?: GoalCategory;
  targetDate?: string | null;
  milestones?: CreateMilestoneProps[];
}

export interface UpdateGoalInput {
  id: string;
  title?: string;
  description?: string | null;
  status?: GoalStatus;
  category?: GoalCategory;
  targetDate?: string | null;
  milestones?: CreateMilestoneProps[];
}

export interface DeleteGoalInput {
  id: string;
}

export interface ToggleMilestoneInput {
  goalId: string;
  milestoneId: string;
}
