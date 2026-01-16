import { Conversation } from "../../index.js";
import { ConversationRepositoryPort } from "../../ports/index.js";

export interface ListConversationsOutput {
  conversations: Conversation[];
}

export class ListConversationsService {
  constructor(private readonly conversationRepository: ConversationRepositoryPort) {}

  async execute(): Promise<ListConversationsOutput> {
    const conversations = await this.conversationRepository.findAll();
    return { conversations };
  }
}
