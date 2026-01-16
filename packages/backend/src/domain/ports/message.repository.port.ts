import { Message, CreateMessageProps } from "../index.js";

export interface MessageRepositoryPort {
  findByConversationId(conversationId: string): Promise<Message[]>;
  create(props: CreateMessageProps): Promise<Message>;
  deleteByConversationId(conversationId: string): Promise<boolean>;
}
