import { Task, TaskStatus } from "../../index.js";
import { TaskRepositoryPort } from "../../ports/index.js";

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskOutput {
  task: Task | null;
}

export class UpdateTaskService {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(input: UpdateTaskInput): Promise<UpdateTaskOutput> {
    const existingTask = await this.taskRepository.findById(input.id);
    if (!existingTask) {
      return { task: null };
    }

    const updateProps: { title?: string; description?: string | null; status?: TaskStatus } = {};

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new Error("Task title cannot be empty");
      }
      updateProps.title = input.title.trim();
    }

    if (input.description !== undefined) {
      updateProps.description = input.description;
    }

    if (input.status !== undefined) {
      updateProps.status = input.status;
    }

    const task = await this.taskRepository.update(input.id, updateProps);
    return { task };
  }
}
