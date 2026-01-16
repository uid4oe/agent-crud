import { Conversation, CreateConversationProps } from "../index.js";

export interface ConversationRepositoryPort {
  findAll(): Promise<Conversation[]>;
  findById(id: string): Promise<Conversation | null>;
  create(props: CreateConversationProps): Promise<Conversation>;
  updateTitle(id: string, title: string): Promise<Conversation | null>;
  delete(id: string): Promise<boolean>;
}
