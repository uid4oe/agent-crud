import { Conversation } from "./entities/conversation.entity.js";
import { Message } from "./entities/message.entity.js";
import { MessageRepositoryPort } from "./ports/message.repository.port.js";
import { ConversationRepositoryPort } from "./ports/conversation.repository.port.js";
import {
  AiAgentPort,
  ConversationNotFoundError,
  MessageNotFoundError,
  MessageNotEditableError,
} from "../shared/index.js";
import type {
  CreateConversationInput,
  GetConversationInput,
  DeleteConversationInput,
  GetMessagesInput,
  ChatInput,
  ChatOutput,
  ChatStreamChunk,
} from "./types.js";

const HISTORY_LIMIT = 20;
const SUMMARIZE_THRESHOLD = 10;

export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
    private readonly aiAgent: AiAgentPort
  ) {}

  async list(): Promise<Conversation[]> {
    return this.conversationRepository.findAll();
  }

  async get(input: GetConversationInput): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(input.id);
    if (!conversation) {
      throw new ConversationNotFoundError(input.id);
    }
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversationRepository.findById(id);
  }

  async create(input: CreateConversationInput = {}): Promise<Conversation> {
    return this.conversationRepository.create({
      title: input.title ?? "New Conversation",
    });
  }

  async delete(input: DeleteConversationInput): Promise<boolean> {
    const existingConversation = await this.conversationRepository.findById(input.id);
    if (!existingConversation) {
      throw new ConversationNotFoundError(input.id);
    }

    return this.conversationRepository.delete(input.id);
  }

  async getMessages(input: GetMessagesInput): Promise<Message[]> {
    return this.messageRepository.findByConversationId(input.conversationId);
  }

  async updateConversationTitle(id: string, title: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.updateTitle(id, title);
    if (!conversation) {
      throw new ConversationNotFoundError(id);
    }
    return conversation;
  }

  async editMessage(id: string, content: string): Promise<Message> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new MessageNotFoundError(id);
    }
    if (message.role !== "user") {
      throw new MessageNotEditableError(id);
    }
    const updated = await this.messageRepository.updateContent(id, content);
    if (!updated) {
      throw new MessageNotFoundError(id);
    }
    return updated;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messageRepository.deleteMessage(id);
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    return this.conversationRepository.search(query);
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    // Save user message and bump conversation timestamp
    await this.messageRepository.create({
      conversationId: input.conversationId,
      role: "user",
      content: input.message,
    });
    await this.conversationRepository.touch(input.conversationId);

    // Get messages and conversation for context
    const [messages, conversation] = await Promise.all([
      this.messageRepository.findByConversationId(input.conversationId),
      this.conversationRepository.findById(input.conversationId),
    ]);

    // Build history for agent context
    const history = this.buildHistory(messages, conversation?.summary);

    // Get AI response
    let aiResponse: string;
    try {
      aiResponse = await this.aiAgent.chat(input.conversationId, input.message, history);
    } catch (error) {
      aiResponse =
        "I'm sorry, something went wrong while processing your request. Please try again.";
      await this.messageRepository.create({
        conversationId: input.conversationId,
        role: "model",
        content: aiResponse,
      });
      throw error;
    }

    // Save AI response
    await this.messageRepository.create({
      conversationId: input.conversationId,
      role: "model",
      content: aiResponse,
    });

    // Generate AI title for first message
    if (messages.length <= 1) {
      this.generateAndSetTitle(input.conversationId, input.message, aiResponse).catch(() => {});
    }

    // Summarize conversation periodically
    if (messages.length > 0 && messages.length % SUMMARIZE_THRESHOLD === 0) {
      this.summarizeAndStore(input.conversationId, messages).catch(() => {});
    }

    return {
      response: aiResponse,
      conversationId: input.conversationId,
    };
  }

  async *chatStream(input: ChatInput): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // Save user message and bump conversation timestamp
    await this.messageRepository.create({
      conversationId: input.conversationId,
      role: "user",
      content: input.message,
    });
    await this.conversationRepository.touch(input.conversationId);

    // Get messages and conversation for context
    const [messages, conversation] = await Promise.all([
      this.messageRepository.findByConversationId(input.conversationId),
      this.conversationRepository.findById(input.conversationId),
    ]);

    // Build history for agent context
    const history = this.buildHistory(messages, conversation?.summary);

    let fullResponse = "";

    try {
      for await (const chunk of this.aiAgent.chatStream(input.conversationId, input.message, history)) {
        fullResponse += chunk.text;

        yield {
          text: chunk.text,
          done: chunk.done,
          conversationId: input.conversationId,
        };
      }
    } catch (error) {
      const content = fullResponse || "[Error: response failed]";
      await this.messageRepository
        .create({ conversationId: input.conversationId, role: "model", content })
        .catch(() => {});
      throw error;
    }

    // Save the complete AI response
    if (fullResponse) {
      await this.messageRepository.create({
        conversationId: input.conversationId,
        role: "model",
        content: fullResponse,
      });
    }

    // Generate AI title for first message
    if (messages.length <= 1) {
      this.generateAndSetTitle(input.conversationId, input.message, fullResponse).catch(() => {});
    }

    // Summarize conversation periodically
    if (messages.length > 0 && messages.length % SUMMARIZE_THRESHOLD === 0) {
      this.summarizeAndStore(input.conversationId, messages).catch(() => {});
    }
  }

  private buildHistory(messages: Message[], summary?: string | null): Array<{ role: string; content: string }> {
    const history: Array<{ role: string; content: string }> = [];

    // Prepend stored summary as context when available
    if (summary) {
      history.push({
        role: "user",
        content: `[Previous conversation summary: ${summary}]`,
      });
    }

    // Use last N messages as history (exclude the most recent user message which is already being sent)
    const relevantMessages = messages.slice(-HISTORY_LIMIT - 1, -1);
    for (const m of relevantMessages) {
      history.push({ role: m.role, content: m.toJSON().content });
    }

    return history;
  }

  private async generateAndSetTitle(
    conversationId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    try {
      const title = await this.aiAgent.generateTitle(userMessage, aiResponse);
      await this.conversationRepository.updateTitle(conversationId, title);
    } catch {
      // Fallback to truncated user message
      const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
      await this.conversationRepository.updateTitle(conversationId, title).catch(() => {});
    }
  }

  private async summarizeAndStore(
    conversationId: string,
    messages: Message[]
  ): Promise<void> {
    try {
      const concatenated = messages
        .map((m) => `${m.role}: ${m.toJSON().content}`)
        .join("\n");
      const summary = await this.aiAgent.summarizeConversation(concatenated);
      await this.conversationRepository.updateSummary(conversationId, summary);
    } catch {
      // Non-critical, ignore
    }
  }
}
