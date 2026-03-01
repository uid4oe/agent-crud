import { Goal } from "./entities/goal.entity.js";
import { GoalRepositoryPort } from "./ports/goal.repository.port.js";
import { GoalNotFoundError, GoalTitleRequiredError } from "../shared/index.js";
import type { PaginationInput, PaginatedResult } from "../shared/types.js";
import type {
  GoalStatus,
  GoalCategory,
  ListGoalsInput,
  GetGoalInput,
  CreateGoalInput,
  UpdateGoalInput,
  DeleteGoalInput,
  ToggleMilestoneInput,
} from "./types.js";

export class GoalService {
  constructor(private readonly goalRepository: GoalRepositoryPort) {}

  async list(input: ListGoalsInput = {}, pagination?: PaginationInput): Promise<PaginatedResult<Goal>> {
    if (input.status) {
      const data = await this.goalRepository.findByStatus(input.status);
      return { data, total: data.length, limit: data.length, offset: 0 };
    }
    if (input.category) {
      const data = await this.goalRepository.findByCategory(input.category);
      return { data, total: data.length, limit: data.length, offset: 0 };
    }
    return this.goalRepository.findAll(pagination);
  }

  async get(input: GetGoalInput): Promise<Goal> {
    const goal = await this.goalRepository.findById(input.id);
    if (!goal) {
      throw new GoalNotFoundError(input.id);
    }
    return goal;
  }

  async findById(id: string): Promise<Goal | null> {
    return this.goalRepository.findById(id);
  }

  async create(input: CreateGoalInput): Promise<Goal> {
    if (!input.title || input.title.trim().length === 0) {
      throw new GoalTitleRequiredError();
    }

    return this.goalRepository.create({
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status ?? "active",
      category: input.category ?? "other",
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      milestones: input.milestones ?? [],
    });
  }

  async update(input: UpdateGoalInput): Promise<Goal> {
    const existingGoal = await this.goalRepository.findById(input.id);
    if (!existingGoal) {
      throw new GoalNotFoundError(input.id);
    }

    const updateProps: {
      title?: string;
      description?: string | null;
      status?: GoalStatus;
      category?: GoalCategory;
      targetDate?: Date | null;
      milestones?: { id?: string; title: string; completed?: boolean; sortOrder?: number }[];
    } = {};

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new GoalTitleRequiredError();
      }
      updateProps.title = input.title.trim();
    }

    if (input.description !== undefined) {
      updateProps.description = input.description;
    }

    if (input.status !== undefined) {
      updateProps.status = input.status;
    }

    if (input.category !== undefined) {
      updateProps.category = input.category;
    }

    if (input.targetDate !== undefined) {
      updateProps.targetDate = input.targetDate ? new Date(input.targetDate) : null;
    }

    if (input.milestones !== undefined) {
      updateProps.milestones = input.milestones;
    }

    const goal = await this.goalRepository.update(input.id, updateProps);
    if (!goal) {
      throw new GoalNotFoundError(input.id);
    }

    return goal;
  }

  async delete(input: DeleteGoalInput): Promise<boolean> {
    const existingGoal = await this.goalRepository.findById(input.id);
    if (!existingGoal) {
      throw new GoalNotFoundError(input.id);
    }

    return this.goalRepository.delete(input.id);
  }

  async toggleMilestone(input: ToggleMilestoneInput): Promise<Goal> {
    const saved = await this.goalRepository.toggleMilestone(
      input.goalId,
      input.milestoneId,
    );

    if (!saved) {
      throw new GoalNotFoundError(input.goalId);
    }

    return saved;
  }

  async search(query: string, status?: GoalStatus): Promise<Goal[]> {
    return this.goalRepository.search(query, status);
  }

  async bulkDelete(ids: string[]): Promise<number> {
    return this.goalRepository.bulkDelete(ids);
  }
}
