import { Conversation } from "../../index.js";
import { ConversationRepositoryPort } from "../../ports/index.js";

export interface CreateConversationInput {
  title?: string;
}

export interface CreateConversationOutput {
  conversation: Conversation;
}

export class CreateConversationService {
  constructor(private readonly conversationRepository: ConversationRepositoryPort) {}

  async execute(input: CreateConversationInput = {}): Promise<CreateConversationOutput> {
    const conversation = await this.conversationRepository.create({
      title: input.title ?? "New Conversation",
    });

    return { conversation };
  }
}
