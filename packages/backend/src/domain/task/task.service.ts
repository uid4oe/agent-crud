import type { Task } from "./entities/task.entity.js";
import type { TaskRepositoryPort } from "./ports/task.repository.port.js";
import { TaskNotFoundError, TaskTitleRequiredError } from "../shared/index.js";
import type { PaginationInput, PaginatedResult } from "../shared/types.js";
import type {
  TaskStatus,
  TaskPriority,
  ListTasksInput,
  GetTaskInput,
  CreateTaskInput,
  UpdateTaskInput,
  DeleteTaskInput,
} from "./types.js";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async list(input: ListTasksInput = {}, pagination?: PaginationInput): Promise<PaginatedResult<Task>> {
    if (input.status) {
      const data = await this.taskRepository.findByStatus(input.status);
      return { data, total: data.length, limit: data.length, offset: 0 };
    }
    return this.taskRepository.findAll(pagination);
  }

  async get(input: GetTaskInput): Promise<Task> {
    const task = await this.taskRepository.findById(input.id);
    if (!task) {
      throw new TaskNotFoundError(input.id);
    }
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    if (!input.title || input.title.trim().length === 0) {
      throw new TaskTitleRequiredError();
    }

    return this.taskRepository.create({
      title: input.title.trim(),
      description: input.description ?? null,
      status: input.status ?? "pending",
      priority: input.priority ?? "normal",
      dueDate: input.dueDate,
      tags: input.tags,
    });
  }

  async update(input: UpdateTaskInput): Promise<Task> {
    const existingTask = await this.taskRepository.findById(input.id);
    if (!existingTask) {
      throw new TaskNotFoundError(input.id);
    }

    const updateProps: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string | null;
      tags?: string[];
    } = {};

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new TaskTitleRequiredError();
      }
      updateProps.title = input.title.trim();
    }

    if (input.description !== undefined) updateProps.description = input.description;
    if (input.status !== undefined) updateProps.status = input.status;
    if (input.priority !== undefined) updateProps.priority = input.priority;
    if (input.dueDate !== undefined) updateProps.dueDate = input.dueDate;
    if (input.tags !== undefined) updateProps.tags = input.tags;

    const task = await this.taskRepository.update(input.id, updateProps);
    if (!task) {
      throw new TaskNotFoundError(input.id);
    }

    return task;
  }

  async delete(input: DeleteTaskInput): Promise<boolean> {
    const existingTask = await this.taskRepository.findById(input.id);
    if (!existingTask) {
      throw new TaskNotFoundError(input.id);
    }

    return this.taskRepository.delete(input.id);
  }

  async search(query: string, status?: TaskStatus): Promise<Task[]> {
    return this.taskRepository.search(query, status);
  }

  async bulkUpdate(ids: string[], props: { status?: TaskStatus; priority?: TaskPriority }): Promise<number> {
    return this.taskRepository.bulkUpdate(ids, props);
  }

  async bulkDelete(ids: string[]): Promise<number> {
    return this.taskRepository.bulkDelete(ids);
  }
}
