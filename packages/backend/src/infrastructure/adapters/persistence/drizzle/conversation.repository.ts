import { desc, eq, ilike, or } from "drizzle-orm";
import {
  Conversation,
  type ConversationRepositoryPort,
  type CreateConversationProps,
} from "../../../../domain/index.js";
import { type DbClient } from "./client.js";
import { conversations, messages } from "./schema.js";

export class DrizzleConversationRepository implements ConversationRepositoryPort {
  constructor(private readonly db: DbClient) {}

  async findAll(): Promise<Conversation[]> {
    const results = await this.db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
    return results.map(this.toDomain);
  }

  async findById(id: string): Promise<Conversation | null> {
    const results = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async search(query: string): Promise<Conversation[]> {
    const searchPattern = `%${query}%`;

    // Search by title
    const titleResults = await this.db
      .select()
      .from(conversations)
      .where(ilike(conversations.title, searchPattern))
      .orderBy(desc(conversations.updatedAt));

    // Search by message content
    const messageResults = await this.db
      .selectDistinct({ id: messages.conversationId })
      .from(messages)
      .where(ilike(messages.content, searchPattern));

    const messageConvIds = new Set(messageResults.map((r) => r.id));
    const titleConvIds = new Set(titleResults.map((r) => r.id));

    // Merge: get conversations matching message content that aren't already in title results
    const additionalIds = [...messageConvIds].filter((id) => !titleConvIds.has(id));
    let additionalConvs: Conversation[] = [];
    if (additionalIds.length > 0) {
      const results = await this.db
        .select()
        .from(conversations)
        .where(or(...additionalIds.map((id) => eq(conversations.id, id)))!)
        .orderBy(desc(conversations.updatedAt));
      additionalConvs = results.map(this.toDomain);
    }

    return [...titleResults.map(this.toDomain), ...additionalConvs];
  }

  async create(props: CreateConversationProps): Promise<Conversation> {
    const results = await this.db
      .insert(conversations)
      .values({
        title: props.title ?? "New Conversation",
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async updateTitle(id: string, title: string): Promise<Conversation | null> {
    const results = await this.db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();

    return results[0] ? this.toDomain(results[0]) : null;
  }

  async updateSummary(id: string, summary: string): Promise<Conversation | null> {
    const results = await this.db
      .update(conversations)
      .set({ summary, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();

    return results[0] ? this.toDomain(results[0]) : null;
  }

  async touch(id: string): Promise<void> {
    await this.db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(conversations).where(eq(conversations.id, id));
    return true;
  }

  private toDomain(record: typeof conversations.$inferSelect): Conversation {
    return Conversation.reconstitute({
      id: record.id,
      title: record.title,
      summary: record.summary ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
