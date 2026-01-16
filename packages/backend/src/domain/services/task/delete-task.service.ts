import { TaskRepositoryPort } from "../../ports/index.js";

export interface DeleteTaskInput {
  id: string;
}

export interface DeleteTaskOutput {
  success: boolean;
}

export class DeleteTaskService {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(input: DeleteTaskInput): Promise<DeleteTaskOutput> {
    const success = await this.taskRepository.delete(input.id);
    return { success };
  }
}
