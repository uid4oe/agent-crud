import { asc, eq } from "drizzle-orm";
import {
  type CreateMessageProps,
  Message,
  type MessageRepositoryPort,
} from "../../../../domain/index.js";
import { type DbClient } from "./client.js";
import { messages } from "./schema.js";

export class DrizzleMessageRepository implements MessageRepositoryPort {
  constructor(private readonly db: DbClient) {}

  async findByConversationId(conversationId: string): Promise<Message[]> {
    const results = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return results.map(this.toDomain);
  }

  async findById(id: string): Promise<Message | null> {
    const results = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async create(props: CreateMessageProps): Promise<Message> {
    const results = await this.db
      .insert(messages)
      .values({
        conversationId: props.conversationId,
        role: props.role,
        content: props.content,
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async updateContent(id: string, content: string): Promise<Message | null> {
    const results = await this.db
      .update(messages)
      .set({ content })
      .where(eq(messages.id, id))
      .returning();
    return results[0] ? this.toDomain(results[0]) : null;
  }

  async deleteMessage(id: string): Promise<boolean> {
    await this.db.delete(messages).where(eq(messages.id, id));
    return true;
  }

  async deleteByConversationId(conversationId: string): Promise<boolean> {
    await this.db.delete(messages).where(eq(messages.conversationId, conversationId));
    return true;
  }

  private toDomain(record: typeof messages.$inferSelect): Message {
    return Message.reconstitute({
      id: record.id,
      conversationId: record.conversationId,
      role: record.role,
      content: record.content,
      createdAt: record.createdAt,
    });
  }
}
