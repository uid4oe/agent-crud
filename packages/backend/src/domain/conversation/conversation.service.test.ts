import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiAgentPort } from "../shared/index.js";
import { ConversationNotFoundError, MessageNotEditableError, MessageNotFoundError } from "../shared/index.js";
import { ConversationService } from "./conversation.service.js";
import { Conversation } from "./entities/conversation.entity.js";
import { Message } from "./entities/message.entity.js";
import type { ConversationRepositoryPort } from "./ports/conversation.repository.port.js";
import type { MessageRepositoryPort } from "./ports/message.repository.port.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeConversation(overrides: Partial<{ id: string; title: string | null; summary: string | null }> = {}): Conversation {
  return Conversation.reconstitute({
    id: overrides.id ?? "c-1",
    title: overrides.title ?? "Test Conversation",
    summary: overrides.summary ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

function makeMessage(overrides: Partial<{ id: string; conversationId: string; role: "user" | "model"; content: string }> = {}): Message {
  return Message.reconstitute({
    id: overrides.id ?? "msg-1",
    conversationId: overrides.conversationId ?? "c-1",
    role: overrides.role ?? "user",
    content: overrides.content ?? "Hello",
    createdAt: now,
  });
}

function mockConversationRepo(): ConversationRepositoryPort {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    updateTitle: vi.fn(),
    updateSummary: vi.fn(),
    touch: vi.fn(),
    delete: vi.fn(),
  };
}

function mockMessageRepo(): MessageRepositoryPort {
  return {
    findByConversationId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateContent: vi.fn(),
    deleteMessage: vi.fn(),
    deleteByConversationId: vi.fn(),
  };
}

function mockAiAgent(): AiAgentPort {
  return {
    chat: vi.fn(),
    chatStream: vi.fn(),
    generateTitle: vi.fn(),
    summarizeConversation: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConversationService", () => {
  let conversationRepo: ReturnType<typeof mockConversationRepo>;
  let messageRepo: ReturnType<typeof mockMessageRepo>;
  let aiAgent: ReturnType<typeof mockAiAgent>;
  let service: ConversationService;

  beforeEach(() => {
    conversationRepo = mockConversationRepo();
    messageRepo = mockMessageRepo();
    aiAgent = mockAiAgent();
    service = new ConversationService(conversationRepo, messageRepo, aiAgent);
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------

  describe("list", () => {
    it("returns all conversations from repository", async () => {
      const conversations = [makeConversation()];
      vi.mocked(conversationRepo.findAll).mockResolvedValue(conversations);

      const result = await service.list();
      expect(result).toEqual(conversations);
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------

  describe("get", () => {
    it("returns conversation when found", async () => {
      const conv = makeConversation();
      vi.mocked(conversationRepo.findById).mockResolvedValue(conv);

      const result = await service.get({ id: "c-1" });
      expect(result.id).toBe("c-1");
    });

    it("throws ConversationNotFoundError when not found", async () => {
      vi.mocked(conversationRepo.findById).mockResolvedValue(null);

      await expect(service.get({ id: "missing" })).rejects.toThrow(ConversationNotFoundError);
    });
  });

  // -----------------------------------------------------------------------
  // findById
  // -----------------------------------------------------------------------

  describe("findById", () => {
    it("returns conversation or null", async () => {
      vi.mocked(conversationRepo.findById).mockResolvedValue(null);

      const result = await service.findById("missing");
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------

  describe("create", () => {
    it("creates conversation with default title", async () => {
      vi.mocked(conversationRepo.create).mockResolvedValue(makeConversation());

      await service.create();
      expect(conversationRepo.create).toHaveBeenCalledWith({ title: "New Conversation" });
    });

    it("creates conversation with custom title", async () => {
      vi.mocked(conversationRepo.create).mockResolvedValue(makeConversation({ title: "Custom" }));

      await service.create({ title: "Custom" });
      expect(conversationRepo.create).toHaveBeenCalledWith({ title: "Custom" });
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------

  describe("delete", () => {
    it("deletes existing conversation", async () => {
      vi.mocked(conversationRepo.findById).mockResolvedValue(makeConversation());
      vi.mocked(conversationRepo.delete).mockResolvedValue(true);

      const result = await service.delete({ id: "c-1" });
      expect(result).toBe(true);
    });

    it("throws ConversationNotFoundError when not found", async () => {
      vi.mocked(conversationRepo.findById).mockResolvedValue(null);

      await expect(service.delete({ id: "missing" })).rejects.toThrow(ConversationNotFoundError);
    });
  });

  // -----------------------------------------------------------------------
  // getMessages
  // -----------------------------------------------------------------------

  describe("getMessages", () => {
    it("returns messages for a conversation", async () => {
      const messages = [makeMessage()];
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue(messages);

      const result = await service.getMessages({ conversationId: "c-1" });
      expect(result).toEqual(messages);
    });
  });

  // -----------------------------------------------------------------------
  // updateConversationTitle
  // -----------------------------------------------------------------------

  describe("updateConversationTitle", () => {
    it("updates and returns conversation", async () => {
      vi.mocked(conversationRepo.updateTitle).mockResolvedValue(makeConversation({ title: "New Title" }));

      const result = await service.updateConversationTitle("c-1", "New Title");
      expect(result.title).toBe("New Title");
    });

    it("throws when conversation not found", async () => {
      vi.mocked(conversationRepo.updateTitle).mockResolvedValue(null);

      await expect(service.updateConversationTitle("missing", "Title")).rejects.toThrow(ConversationNotFoundError);
    });
  });

  // -----------------------------------------------------------------------
  // editMessage
  // -----------------------------------------------------------------------

  describe("editMessage", () => {
    it("edits a user message", async () => {
      vi.mocked(messageRepo.findById).mockResolvedValue(makeMessage({ role: "user" }));
      vi.mocked(messageRepo.updateContent).mockResolvedValue(
        makeMessage({ content: "Updated" })
      );

      const result = await service.editMessage("msg-1", "Updated");
      expect(result.content).toBe("Updated");
    });

    it("throws MessageNotFoundError when message not found", async () => {
      vi.mocked(messageRepo.findById).mockResolvedValue(null);

      await expect(service.editMessage("missing", "text")).rejects.toThrow(MessageNotFoundError);
    });

    it("throws MessageNotEditableError when trying to edit a model message", async () => {
      vi.mocked(messageRepo.findById).mockResolvedValue(makeMessage({ role: "model" }));

      await expect(service.editMessage("msg-1", "text")).rejects.toThrow(MessageNotEditableError);
    });

    it("throws MessageNotFoundError when update fails", async () => {
      vi.mocked(messageRepo.findById).mockResolvedValue(makeMessage({ role: "user" }));
      vi.mocked(messageRepo.updateContent).mockResolvedValue(null);

      await expect(service.editMessage("msg-1", "text")).rejects.toThrow(MessageNotFoundError);
    });
  });

  // -----------------------------------------------------------------------
  // deleteMessage
  // -----------------------------------------------------------------------

  describe("deleteMessage", () => {
    it("delegates to message repository", async () => {
      vi.mocked(messageRepo.deleteMessage).mockResolvedValue(true);

      const result = await service.deleteMessage("msg-1");
      expect(result).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // searchConversations
  // -----------------------------------------------------------------------

  describe("searchConversations", () => {
    it("delegates to conversation repository", async () => {
      vi.mocked(conversationRepo.search).mockResolvedValue([makeConversation()]);

      const result = await service.searchConversations("test");
      expect(result).toHaveLength(1);
      expect(conversationRepo.search).toHaveBeenCalledWith("test");
    });
  });

  // -----------------------------------------------------------------------
  // chat
  // -----------------------------------------------------------------------

  describe("chat", () => {
    it("saves user message, calls AI, saves response", async () => {
      vi.mocked(messageRepo.create).mockResolvedValue(makeMessage());
      vi.mocked(conversationRepo.touch).mockResolvedValue();
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue([
        makeMessage({ id: "msg-1", role: "user", content: "Hello" }),
      ]);
      vi.mocked(aiAgent.chat).mockResolvedValue("Hi there!");

      const result = await service.chat({
        conversationId: "c-1",
        message: "Hello",
      });

      expect(result.response).toBe("Hi there!");
      expect(result.conversationId).toBe("c-1");
      // User message saved
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: "user", content: "Hello" })
      );
      // AI response saved
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: "model", content: "Hi there!" })
      );
      // Conversation touched
      expect(conversationRepo.touch).toHaveBeenCalledWith("c-1");
    });

    it("generates title on first message", async () => {
      vi.mocked(messageRepo.create).mockResolvedValue(makeMessage());
      vi.mocked(conversationRepo.touch).mockResolvedValue();
      // Only 1 message (the user's) — triggers title generation
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue([
        makeMessage({ role: "user", content: "Hello" }),
      ]);
      vi.mocked(aiAgent.chat).mockResolvedValue("Hi!");
      vi.mocked(aiAgent.generateTitle).mockResolvedValue("Greeting Chat");
      vi.mocked(conversationRepo.updateTitle).mockResolvedValue(makeConversation());

      await service.chat({ conversationId: "c-1", message: "Hello" });

      // Allow async title generation to run
      await new Promise((r) => setTimeout(r, 10));

      expect(aiAgent.generateTitle).toHaveBeenCalledWith("Hello", "Hi!");
    });

    it("saves error response and re-throws on AI failure", async () => {
      vi.mocked(messageRepo.create).mockResolvedValue(makeMessage());
      vi.mocked(conversationRepo.touch).mockResolvedValue();
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue([]);
      vi.mocked(aiAgent.chat).mockRejectedValue(new Error("AI down"));

      await expect(
        service.chat({ conversationId: "c-1", message: "Hello" })
      ).rejects.toThrow("AI down");

      // Error response should have been saved
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "model",
          content: expect.stringContaining("something went wrong"),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // chatStream
  // -----------------------------------------------------------------------

  describe("chatStream", () => {
    it("streams chunks from AI agent", async () => {
      vi.mocked(messageRepo.create).mockResolvedValue(makeMessage());
      vi.mocked(conversationRepo.touch).mockResolvedValue();
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue([
        makeMessage({ role: "user" }),
      ]);

      async function* fakeStream() {
        yield { text: "Hello ", done: false };
        yield { text: "world", done: false };
        yield { text: "", done: true };
      }
      vi.mocked(aiAgent.chatStream).mockReturnValue(fakeStream());

      const chunks: Array<{ text: string; done: boolean }> = [];
      for await (const chunk of service.chatStream({ conversationId: "c-1", message: "Hi" })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].text).toBe("Hello ");
      expect(chunks[1].text).toBe("world");
      expect(chunks[2].done).toBe(true);
    });

    it("saves complete response after streaming", async () => {
      vi.mocked(messageRepo.create).mockResolvedValue(makeMessage());
      vi.mocked(conversationRepo.touch).mockResolvedValue();
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue([]);

      async function* fakeStream() {
        yield { text: "Full response", done: false };
        yield { text: "", done: true };
      }
      vi.mocked(aiAgent.chatStream).mockReturnValue(fakeStream());

      // Consume the stream
      for await (const _chunk of service.chatStream({ conversationId: "c-1", message: "Hi" })) {
        // consume
      }

      // Full response saved as model message
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: "model", content: "Full response" })
      );
    });

    it("saves partial response on error and re-throws", async () => {
      vi.mocked(messageRepo.create).mockResolvedValue(makeMessage());
      vi.mocked(conversationRepo.touch).mockResolvedValue();
      vi.mocked(messageRepo.findByConversationId).mockResolvedValue([]);

      async function* failingStream() {
        yield { text: "Partial", done: false };
        throw new Error("Stream died");
      }
      vi.mocked(aiAgent.chatStream).mockReturnValue(failingStream());

      const chunks: Array<{ text: string }> = [];
      await expect(async () => {
        for await (const chunk of service.chatStream({ conversationId: "c-1", message: "Hi" })) {
          chunks.push(chunk);
        }
      }).rejects.toThrow("Stream died");

      // Partial response saved
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: "model", content: "Partial" })
      );
    });
  });
});
