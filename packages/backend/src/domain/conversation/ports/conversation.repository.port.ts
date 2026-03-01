import { Conversation } from "../entities/conversation.entity.js";
import type { CreateConversationProps } from "../types.js";

export interface ConversationRepositoryPort {
  findAll(): Promise<Conversation[]>;

  findById(id: string): Promise<Conversation | null>;

  search(query: string): Promise<Conversation[]>;

  create(props: CreateConversationProps): Promise<Conversation>;

  updateTitle(id: string, title: string): Promise<Conversation | null>;

  updateSummary(id: string, summary: string): Promise<Conversation | null>;

  touch(id: string): Promise<void>;

  delete(id: string): Promise<boolean>;
}
