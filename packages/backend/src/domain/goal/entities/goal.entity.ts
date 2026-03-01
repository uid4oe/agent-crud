import {
  GoalInvalidCategoryError,
  GoalInvalidStatusError,
  GoalTitleRequiredError,
} from "../../shared/errors/index.js";
import type {
  CreateMilestoneProps,
  GoalCategory,
  GoalProps,
  GoalStatus,
  MilestoneProps,
} from "../types.js";
import {
  GoalCategoryValues,
  GoalStatusValues,
} from "../types.js";

export class Goal {
  private constructor(private readonly props: GoalProps) {}

  static create(props: GoalProps): Goal {
    if (!props.title || props.title.trim().length === 0) {
      throw new GoalTitleRequiredError();
    }
    if (!GoalStatusValues.includes(props.status)) {
      throw new GoalInvalidStatusError(props.status);
    }
    if (!GoalCategoryValues.includes(props.category)) {
      throw new GoalInvalidCategoryError(props.category);
    }
    return new Goal(props);
  }

  static reconstitute(props: GoalProps): Goal {
    return new Goal(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): GoalStatus {
    return this.props.status;
  }

  get category(): GoalCategory {
    return this.props.category;
  }

  get targetDate(): Date | null {
    return this.props.targetDate;
  }

  get milestones(): MilestoneProps[] {
    return [...this.props.milestones];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get progress(): { completed: number; total: number; percentage: number } {
    const total = this.props.milestones.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = this.props.milestones.filter((m) => m.completed).length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  }

  addMilestone(milestone: CreateMilestoneProps): Goal {
    const newMilestone: MilestoneProps = {
      id: crypto.randomUUID(),
      goalId: this.props.id,
      title: milestone.title,
      completed: milestone.completed ?? false,
      sortOrder: milestone.sortOrder ?? this.props.milestones.length,
      createdAt: new Date(),
    };
    return new Goal({
      ...this.props,
      milestones: [...this.props.milestones, newMilestone],
      updatedAt: new Date(),
    });
  }

  toggleMilestone(milestoneId: string): Goal {
    const milestones = this.props.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    return new Goal({
      ...this.props,
      milestones,
      updatedAt: new Date(),
    });
  }

  removeMilestone(milestoneId: string): Goal {
    return new Goal({
      ...this.props,
      milestones: this.props.milestones.filter((m) => m.id !== milestoneId),
      updatedAt: new Date(),
    });
  }

  toJSON(): GoalProps {
    return {
      ...this.props,
      milestones: [...this.props.milestones],
    };
  }
}
