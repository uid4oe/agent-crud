import { eq, ilike, or, sql, desc, asc, and, count, inArray, type AnyColumn } from "drizzle-orm";
import { type DbClient } from "./client.js";
import { tasks } from "./schema.js";
import {
  Task,
  type TaskStatus,
  type CreateTaskProps,
  type UpdateTaskProps,
  type TaskRepositoryPort,
  type PaginationInput,
  type PaginatedResult,
} from "../../../../domain/index.js";

export class DrizzleTaskRepository implements TaskRepositoryPort {
  constructor(private readonly db: DbClient) {}

  private getSortColumn(sortBy?: string): AnyColumn {
    const sortMap: Record<string, AnyColumn> = {
      updatedAt: tasks.updatedAt,
      createdAt: tasks.createdAt,
      title: tasks.title,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
    };
    return sortMap[sortBy ?? ""] ?? tasks.updatedAt;
  }

  async findAll(pagination?: PaginationInput): Promise<PaginatedResult<Task>> {
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const sortCol = this.getSortColumn(pagination?.sortBy);
    const orderFn = pagination?.sortOrder === "asc" ? asc : desc;

    const [results, [{ total }]] = await Promise.all([
      this.db.select().from(tasks).orderBy(orderFn(sortCol)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(tasks),
    ]);

    return {
      data: results.map(this.toDomain),
      total,
      limit,
      offset,
    };
  }

  async findById(id: string): Promise<Task | null> {
    const results = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const results = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.status, status))
      .orderBy(desc(tasks.updatedAt));
    return results.map(this.toDomain);
  }

  async findByTag(tag: string): Promise<Task[]> {
    const results = await this.db
      .select()
      .from(tasks)
      .where(sql`${tasks.tags} @> ${JSON.stringify([tag])}`)
      .orderBy(desc(tasks.updatedAt));
    return results.map(this.toDomain);
  }

  async search(query: string, status?: TaskStatus): Promise<Task[]> {
    const searchPattern = `%${query}%`;

    const textCondition = or(
      ilike(tasks.title, searchPattern),
      ilike(tasks.description, searchPattern)
    );

    const whereClause = status
      ? and(textCondition, eq(tasks.status, status))
      : textCondition;

    const results = await this.db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(desc(tasks.updatedAt));

    return results.map(this.toDomain);
  }

  async create(props: CreateTaskProps): Promise<Task> {
    const results = await this.db
      .insert(tasks)
      .values({
        title: props.title,
        description: props.description ?? null,
        status: props.status ?? "pending",
        priority: props.priority ?? "normal",
        dueDate: props.dueDate ? new Date(props.dueDate) : null,
        tags: props.tags ?? [],
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async update(id: string, props: UpdateTaskProps): Promise<Task | null> {
    const updateData: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };

    if (props.title !== undefined) updateData.title = props.title;
    if (props.description !== undefined) updateData.description = props.description;
    if (props.status !== undefined) updateData.status = props.status;
    if (props.priority !== undefined) updateData.priority = props.priority;
    if (props.dueDate !== undefined) updateData.dueDate = props.dueDate ? new Date(props.dueDate) : null;
    if (props.tags !== undefined) updateData.tags = props.tags;

    const results = await this.db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    return results[0] ? this.toDomain(results[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  async getAllTags(): Promise<string[]> {
    const results = await this.db
      .selectDistinct({ tags: tasks.tags })
      .from(tasks);

    const allTags = new Set<string>();
    for (const row of results) {
      if (Array.isArray(row.tags)) {
        for (const tag of row.tags) {
          allTags.add(tag);
        }
      }
    }
    return Array.from(allTags).sort();
  }

  async bulkUpdate(ids: string[], props: UpdateTaskProps): Promise<number> {
    if (ids.length === 0) return 0;
    const updateData: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
    if (props.title !== undefined) updateData.title = props.title;
    if (props.description !== undefined) updateData.description = props.description;
    if (props.status !== undefined) updateData.status = props.status;
    if (props.priority !== undefined) updateData.priority = props.priority;

    const results = await this.db
      .update(tasks)
      .set(updateData)
      .where(inArray(tasks.id, ids))
      .returning();

    return results.length;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const results = await this.db
      .delete(tasks)
      .where(inArray(tasks.id, ids))
      .returning();

    return results.length;
  }

  private toDomain(record: typeof tasks.$inferSelect): Task {
    return Task.reconstitute({
      id: record.id,
      title: record.title,
      description: record.description,
      status: record.status,
      priority: record.priority,
      dueDate: record.dueDate,
      tags: Array.isArray(record.tags) ? record.tags : [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
