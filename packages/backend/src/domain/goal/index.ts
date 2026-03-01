// Types
export type {
  GoalStatus,
  GoalCategory,
  GoalProps,
  MilestoneProps,
  CreateMilestoneProps,
  CreateGoalProps,
  UpdateGoalProps,
  ListGoalsInput,
  GetGoalInput,
  CreateGoalInput,
  UpdateGoalInput,
  DeleteGoalInput,
  ToggleMilestoneInput,
} from "./types.js";
export { GoalStatusValues, GoalCategoryValues } from "./types.js";

// Entity
export { Goal } from "./entities/goal.entity.js";

// Ports
export type { GoalRepositoryPort } from "./ports/goal.repository.port.js";

// Service
export { GoalService } from "./goal.service.js";
