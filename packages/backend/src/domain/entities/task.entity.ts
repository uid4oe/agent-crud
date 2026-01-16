import { TaskStatus, TaskStatusValues } from "../value-objects/task-status.vo.js";

export interface TaskProps {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskProps {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskProps {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export class Task {
  private constructor(private readonly props: TaskProps) {}

  static create(props: TaskProps): Task {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }
    if (!TaskStatusValues.includes(props.status)) {
      throw new Error(`Invalid task status: ${props.status}`);
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTitle(title: string): Task {
    if (!title || title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
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
      throw new Error(`Invalid task status: ${status}`);
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
    return { ...this.props };
  }
}
