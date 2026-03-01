import type { Message } from "../entities/message.entity.js";
import type { CreateMessageProps } from "../types.js";

export interface MessageRepositoryPort {
  findByConversationId(conversationId: string): Promise<Message[]>;

  findById(id: string): Promise<Message | null>;

  create(props: CreateMessageProps): Promise<Message>;

  updateContent(id: string, content: string): Promise<Message | null>;

  deleteMessage(id: string): Promise<boolean>;

  deleteByConversationId(conversationId: string): Promise<boolean>;
}
