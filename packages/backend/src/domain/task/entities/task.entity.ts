import { TaskStatus, TaskStatusValues, TaskPriority, TaskPriorityValues } from "../types.js";
import { TaskTitleRequiredError, TaskInvalidStatusError } from "../../shared/errors/index.js";
import type { TaskProps } from "../types.js";

export class Task {
  private constructor(private readonly props: TaskProps) {}

  static create(props: TaskProps): Task {
    if (!props.title || props.title.trim().length === 0) {
      throw new TaskTitleRequiredError();
    }
    if (!TaskStatusValues.includes(props.status)) {
      throw new TaskInvalidStatusError(props.status);
    }
    return new Task(props);
  }

  static reconstitute(props: TaskProps): Task {
    return new Task(props);
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

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTitle(title: string): Task {
    if (!title || title.trim().length === 0) {
      throw new TaskTitleRequiredError();
    }
    return new Task({
      ...this.props,
      title,
      updatedAt: new Date(),
    });
  }

  updateDescription(description: string | null): Task {
    return new Task({
      ...this.props,
      description,
      updatedAt: new Date(),
    });
  }

  updateStatus(status: TaskStatus): Task {
    if (!TaskStatusValues.includes(status)) {
      throw new TaskInvalidStatusError(status);
    }
    return new Task({
      ...this.props,
      status,
      updatedAt: new Date(),
    });
  }

  markAsInProgress(): Task {
    return this.updateStatus("in_progress");
  }

  markAsCompleted(): Task {
    return this.updateStatus("completed");
  }

  markAsPending(): Task {
    return this.updateStatus("pending");
  }

  toJSON(): TaskProps {
    return { ...this.props, tags: [...this.props.tags] };
  }
}
