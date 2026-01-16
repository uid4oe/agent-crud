import { Task, TaskStatus } from "../../index.js";
import { TaskRepositoryPort } from "../../ports/index.js";

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface CreateTaskOutput {
  task: Task;
}

export class CreateTaskService {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Task title is required");
    }

    const task = await this.taskRepository.create({
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status ?? "pending",
    });

    return { task };
  }
}
