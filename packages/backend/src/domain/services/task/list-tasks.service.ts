import { Task, TaskStatus } from "../../index.js";
import { TaskRepositoryPort } from "../../ports/index.js";

export interface ListTasksInput {
  status?: TaskStatus;
}

export interface ListTasksOutput {
  tasks: Task[];
}

export class ListTasksService {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(input: ListTasksInput = {}): Promise<ListTasksOutput> {
    const tasks = input.status
      ? await this.taskRepository.findByStatus(input.status)
      : await this.taskRepository.findAll();

    return { tasks };
  }
}
