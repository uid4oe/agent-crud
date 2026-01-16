import { Task, CreateTaskProps, UpdateTaskProps, TaskStatus } from "../index.js";

export interface TaskRepositoryPort {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findByStatus(status: TaskStatus): Promise<Task[]>;
  search(query: string, status?: TaskStatus): Promise<Task[]>;
  create(props: CreateTaskProps): Promise<Task>;
  update(id: string, props: UpdateTaskProps): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  countByStatus(status: TaskStatus): Promise<number>;
}
