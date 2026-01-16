import { ConversationRepositoryPort } from "../../ports/index.js";

export interface DeleteConversationInput {
  id: string;
}

export interface DeleteConversationOutput {
  success: boolean;
}

export class DeleteConversationService {
  constructor(private readonly conversationRepository: ConversationRepositoryPort) {}

  async execute(input: DeleteConversationInput): Promise<DeleteConversationOutput> {
    const success = await this.conversationRepository.delete(input.id);
    return { success };
  }
}
