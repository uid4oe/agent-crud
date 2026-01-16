import {
  MessageRepositoryPort,
  ConversationRepositoryPort,
  AiAgentPort,
  ChatHistory
} from "../../ports/index.js";

export interface ChatInput {
  conversationId: string;
  message: string;
}

export interface ChatOutput {
  response: string;
  conversationId: string;
}

export class ChatService {
  constructor(
    private readonly messageRepository: MessageRepositoryPort,
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly aiAgent: AiAgentPort
  ) {}

  async execute(input: ChatInput): Promise<ChatOutput> {
    await this.messageRepository.create({
      conversationId: input.conversationId,
      role: "user",
      content: input.message,
    });

    const messages = await this.messageRepository.findByConversationId(input.conversationId);

    const chatHistory: ChatHistory[] = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const aiResponse = await this.aiAgent.chat(chatHistory, input.message);

    await this.messageRepository.create({
      conversationId: input.conversationId,
      role: "model",
      content: aiResponse,
    });

    if (messages.length <= 1) {
      const title = input.message.slice(0, 50) + (input.message.length > 50 ? "..." : "");
      await this.conversationRepository.updateTitle(input.conversationId, title);
    }

    return {
      response: aiResponse,
      conversationId: input.conversationId,
    };
  }
}
