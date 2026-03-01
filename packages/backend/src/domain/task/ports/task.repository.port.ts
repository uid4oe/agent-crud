import type { PaginatedResult, PaginationInput } from "../../shared/types.js";
import type { Task } from "../entities/task.entity.js";
import type { CreateTaskProps, TaskStatus, UpdateTaskProps } from "../types.js";

export interface TaskRepositoryPort {
  findAll(pagination?: PaginationInput): Promise<PaginatedResult<Task>>;

  findById(id: string): Promise<Task | null>;

  findByStatus(status: TaskStatus): Promise<Task[]>;

  findByTag(tag: string): Promise<Task[]>;

  search(query: string, status?: TaskStatus): Promise<Task[]>;

  create(props: CreateTaskProps): Promise<Task>;

  update(id: string, props: UpdateTaskProps): Promise<Task | null>;

  delete(id: string): Promise<boolean>;

  getAllTags(): Promise<string[]>;

  bulkUpdate(ids: string[], props: UpdateTaskProps): Promise<number>;

  bulkDelete(ids: string[]): Promise<number>;
}
