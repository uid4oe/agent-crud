import type { Goal } from "../entities/goal.entity.js";
import type {
  GoalStatus,
  GoalCategory,
  CreateGoalProps,
  UpdateGoalProps,
} from "../types.js";
import type { PaginationInput, PaginatedResult } from "../../shared/types.js";

export interface GoalRepositoryPort {
  findAll(pagination?: PaginationInput): Promise<PaginatedResult<Goal>>;

  findById(id: string): Promise<Goal | null>;

  findByStatus(status: GoalStatus): Promise<Goal[]>;

  findByCategory(category: GoalCategory): Promise<Goal[]>;

  search(query: string, status?: GoalStatus): Promise<Goal[]>;

  create(props: CreateGoalProps): Promise<Goal>;

  update(id: string, props: UpdateGoalProps): Promise<Goal | null>;

  toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null>;

  delete(id: string): Promise<boolean>;

  bulkDelete(ids: string[]): Promise<number>;
}
