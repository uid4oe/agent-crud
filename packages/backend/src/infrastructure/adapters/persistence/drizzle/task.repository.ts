import { eq, ilike, or, sql, asc } from "drizzle-orm";
import { db } from "./client.js";
import { tasks } from "./schema.js";
import { Task, TaskStatus, CreateTaskProps, UpdateTaskProps, TaskRepositoryPort } from "../../../../domain/index.js";

export class DrizzleTaskRepository implements TaskRepositoryPort {
  async findAll(): Promise<Task[]> {
    const results = await db.select().from(tasks).orderBy(asc(tasks.createdAt));
    return results.map(this.toDomain);
  }

  async findById(id: string): Promise<Task | null> {
    const results = await db.select().from(tasks).where(eq(tasks.id, id));
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const results = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, status))
      .orderBy(asc(tasks.createdAt));
    return results.map(this.toDomain);
  }

  async search(query: string, status?: TaskStatus): Promise<Task[]> {
    const searchPattern = `%${query}%`;

    let results;
    if (status) {
      results = await db
        .select()
        .from(tasks)
        .where(
          sql`(${ilike(tasks.title, searchPattern)} OR ${ilike(tasks.description, searchPattern)}) AND ${eq(tasks.status, status)}`
        )
        .orderBy(asc(tasks.createdAt));
    } else {
      results = await db
        .select()
        .from(tasks)
        .where(
          or(
            ilike(tasks.title, searchPattern),
            ilike(tasks.description, searchPattern)
          )
        )
        .orderBy(asc(tasks.createdAt));
    }

    return results.map(this.toDomain);
  }

  async create(props: CreateTaskProps): Promise<Task> {
    const results = await db
      .insert(tasks)
      .values({
        title: props.title,
        description: props.description ?? null,
        status: props.status ?? "pending",
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async update(id: string, props: UpdateTaskProps): Promise<Task | null> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (props.title !== undefined) {
      updateData.title = props.title;
    }
    if (props.description !== undefined) {
      updateData.description = props.description;
    }
    if (props.status !== undefined) {
      updateData.status = props.status;
    }

    const results = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    return results[0] ? this.toDomain(results[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  async count(): Promise<number> {
    const results = await db.select().from(tasks);
    return results.length;
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    const results = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, status));
    return results.length;
  }

  private toDomain(record: typeof tasks.$inferSelect): Task {
    return Task.reconstitute({
      id: record.id,
      title: record.title,
      description: record.description,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
