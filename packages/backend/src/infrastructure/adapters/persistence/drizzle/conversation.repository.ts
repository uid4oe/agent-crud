import { eq, asc } from "drizzle-orm";
import { db } from "./client.js";
import { conversations } from "./schema.js";
import { Conversation, CreateConversationProps, ConversationRepositoryPort } from "../../../../domain/index.js";

export class DrizzleConversationRepository implements ConversationRepositoryPort {
  async findAll(): Promise<Conversation[]> {
    const results = await db
      .select()
      .from(conversations)
      .orderBy(asc(conversations.createdAt));
    return results.map(this.toDomain);
  }

  async findById(id: string): Promise<Conversation | null> {
    const results = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async create(props: CreateConversationProps): Promise<Conversation> {
    const results = await db
      .insert(conversations)
      .values({
        title: props.title ?? "New Conversation",
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async updateTitle(id: string, title: string): Promise<Conversation | null> {
    const results = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();

    return results[0] ? this.toDomain(results[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(conversations).where(eq(conversations.id, id));
    return true;
  }

  private toDomain(record: typeof conversations.$inferSelect): Conversation {
    return Conversation.reconstitute({
      id: record.id,
      title: record.title,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
