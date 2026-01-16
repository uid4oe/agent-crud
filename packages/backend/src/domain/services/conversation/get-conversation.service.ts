import { Conversation } from "../../index.js";
import { ConversationRepositoryPort } from "../../ports/index.js";

export interface GetConversationInput {
  id: string;
}

export interface GetConversationOutput {
  conversation: Conversation | null;
}

export class GetConversationService {
  constructor(private readonly conversationRepository: ConversationRepositoryPort) {}

  async execute(input: GetConversationInput): Promise<GetConversationOutput> {
    const conversation = await this.conversationRepository.findById(input.id);
    return { conversation };
  }
}
