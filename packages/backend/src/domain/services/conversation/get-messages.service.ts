import { Message } from "../../index.js";
import { MessageRepositoryPort } from "../../ports/index.js";

export interface GetMessagesInput {
  conversationId: string;
}

export interface GetMessagesOutput {
  messages: Message[];
}

export class GetMessagesService {
  constructor(private readonly messageRepository: MessageRepositoryPort) {}

  async execute(input: GetMessagesInput): Promise<GetMessagesOutput> {
    const messages = await this.messageRepository.findByConversationId(input.conversationId);
    return { messages };
  }
}
