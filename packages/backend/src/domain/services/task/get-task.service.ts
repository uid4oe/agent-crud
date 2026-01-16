import { Task } from "../../index.js";
import { TaskRepositoryPort } from "../../ports/index.js";

export interface GetTaskInput {
  id: string;
}

export interface GetTaskOutput {
  task: Task | null;
}

export class GetTaskService {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(input: GetTaskInput): Promise<GetTaskOutput> {
    const task = await this.taskRepository.findById(input.id);
    return { task };
  }
}
