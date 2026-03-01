// Types


// Entity
export { Goal } from "./entities/goal.entity.js";
// Service
export { GoalService } from "./goal.service.js";
// Ports
export type { GoalRepositoryPort } from "./ports/goal.repository.port.js";
export type {
  CreateGoalInput,
  CreateGoalProps,
  CreateMilestoneProps,
  DeleteGoalInput,
  GetGoalInput,
  GoalCategory,
  GoalProps,
  GoalStatus,
  ListGoalsInput,
  MilestoneProps,
  ToggleMilestoneInput,
  UpdateGoalInput,
  UpdateGoalProps,
} from "./types.js";
export { GoalCategoryValues, GoalStatusValues } from "./types.js";
