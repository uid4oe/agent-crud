import { eq, asc } from "drizzle-orm";
import { db } from "./client.js";
import { messages } from "./schema.js";
import { Message, CreateMessageProps, MessageRepositoryPort } from "../../../../domain/index.js";

export class DrizzleMessageRepository implements MessageRepositoryPort {
  async findByConversationId(conversationId: string): Promise<Message[]> {
    const results = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return results.map(this.toDomain);
  }

  async create(props: CreateMessageProps): Promise<Message> {
    const results = await db
      .insert(messages)
      .values({
        conversationId: props.conversationId,
        role: props.role,
        content: props.content,
      })
      .returning();

    return this.toDomain(results[0]);
  }

  async deleteByConversationId(conversationId: string): Promise<boolean> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
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
