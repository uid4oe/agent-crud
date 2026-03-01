import { eq, ilike, or, sql, desc, asc, and, count, inArray, type AnyColumn } from "drizzle-orm";
import { type DbClient } from "./client.js";
import { notes } from "./schema.js";
import {
  Note,
  type NoteCategory,
  type CreateNoteProps,
  type UpdateNoteProps,
  type NoteRepositoryPort,
  type PaginationInput,
  type PaginatedResult,
} from "../../../../domain/index.js";

export class DrizzleNoteRepository implements NoteRepositoryPort {
  constructor(private readonly db: DbClient) {}

  private getSortColumn(sortBy?: string): AnyColumn {
    const sortMap: Record<string, AnyColumn> = {
      updatedAt: notes.updatedAt,
      createdAt: notes.createdAt,
      title: notes.title,
    };
    return sortMap[sortBy ?? ""] ?? notes.updatedAt;
  }

  async findAll(pagination?: PaginationInput): Promise<PaginatedResult<Note>> {
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const sortCol = this.getSortColumn(pagination?.sortBy);
    const orderFn = pagination?.sortOrder === "asc" ? asc : desc;

    const [results, [{ total }]] = await Promise.all([
      this.db.select().from(notes).orderBy(orderFn(sortCol)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(notes),
    ]);

    return {
      data: results.map(this.toDomain),
      total,
      limit,
      offset,
    };
  }

  async findById(id: string): Promise<Note | null> {
    const results = await this.db.select().from(notes).where(eq(notes.id, id));
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async findByCategory(category: NoteCategory): Promise<Note[]> {
    const results = await this.db
      .select()
      .from(notes)
      .where(eq(notes.category, category))
      .orderBy(desc(notes.updatedAt));
    return results.map(this.toDomain);
  }

  async findByTag(tag: string): Promise<Note[]> {
    const results = await this.db
      .select()
      .from(notes)
      .where(sql`${notes.tags} @> ${JSON.stringify([tag])}`)
      .orderBy(desc(notes.updatedAt));
    return results.map(this.toDomain);
  }

  async search(query: string, category?: NoteCategory): Promise<Note[]> {
    const searchPattern = `%${query}%`;

    const searchCondition = or(
      ilike(notes.title, searchPattern),
      ilike(notes.content, searchPattern)
    );

    const whereClause = category
      ? and(searchCondition, eq(notes.category, category))
      : searchCondition;

    const results = await this.db
      .select()
      .from(notes)
      .where(whereClause)
      .orderBy(desc(notes.updatedAt));

    return results.map(this.toDomain);
  }

  async create(props: CreateNoteProps): Promise<Note> {
    const results = await this.db
      .insert(notes)
      .values({
        title: props.title,
        content: props.content ?? "",
        category: props.category ?? "general",
        tags: props.tags ?? [],
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async update(id: string, props: UpdateNoteProps): Promise<Note | null> {
    const updateData: Partial<typeof notes.$inferInsert> = { updatedAt: new Date() };

    if (props.title !== undefined) {
      updateData.title = props.title;
    }
    if (props.content !== undefined) {
      updateData.content = props.content;
    }
    if (props.category !== undefined) {
      updateData.category = props.category;
    }
    if (props.tags !== undefined) {
      updateData.tags = props.tags;
    }

    const results = await this.db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();

    return results[0] ? this.toDomain(results[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(notes).where(eq(notes.id, id));
    return true;
  }

  async getAllTags(): Promise<string[]> {
    // Get all unique tags across all notes
    const results = await this.db
      .selectDistinct({ tags: notes.tags })
      .from(notes);

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

  async bulkUpdate(ids: string[], props: UpdateNoteProps): Promise<number> {
    if (ids.length === 0) return 0;
    const updateData: Partial<typeof notes.$inferInsert> = { updatedAt: new Date() };
    if (props.title !== undefined) updateData.title = props.title;
    if (props.content !== undefined) updateData.content = props.content;
    if (props.category !== undefined) updateData.category = props.category;
    if (props.tags !== undefined) updateData.tags = props.tags;

    const results = await this.db
      .update(notes)
      .set(updateData)
      .where(inArray(notes.id, ids))
      .returning();

    return results.length;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const results = await this.db
      .delete(notes)
      .where(inArray(notes.id, ids))
      .returning();

    return results.length;
  }

  private toDomain(record: typeof notes.$inferSelect): Note {
    return Note.reconstitute({
      id: record.id,
      title: record.title,
      content: record.content,
      category: record.category,
      tags: Array.isArray(record.tags) ? record.tags : [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
