import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";
import type { ConversationService } from "../../domain/index.js";

export function createAgentRouter(conversationService: ConversationService) {
  return router({
    createConversation: publicProcedure
      .input(z.object({ title: z.string().optional() }).optional())
      .mutation(async ({ input }) => {
        const conversation = await conversationService.create({
          title: input?.title,
        });
        return conversation.toJSON();
      }),

    getConversation: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const conversation = await conversationService.findById(input.id);
        return conversation ? conversation.toJSON() : null;
      }),

    listConversations: publicProcedure.query(async () => {
      const conversations = await conversationService.list();
      return conversations.map((c) => c.toJSON());
    }),

    searchConversations: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const conversations = await conversationService.searchConversations(input.query);
        return conversations.map((c) => c.toJSON());
      }),

    updateConversationTitle: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ input }) => {
        const conversation = await conversationService.updateConversationTitle(
          input.id,
          input.title
        );
        return conversation.toJSON();
      }),

    deleteConversation: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const success = await conversationService.delete({ id: input.id });
        return { success };
      }),

    getMessages: publicProcedure
      .input(z.object({ conversationId: z.string().uuid() }))
      .query(async ({ input }) => {
        const messages = await conversationService.getMessages({
          conversationId: input.conversationId,
        });
        return messages.map((m) => m.toJSON());
      }),

    editMessage: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const message = await conversationService.editMessage(input.id, input.content);
        return message.toJSON();
      }),

    deleteMessage: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const success = await conversationService.deleteMessage(input.id);
        return { success };
      }),

    chat: publicProcedure
      .input(
        z.object({
          conversationId: z.string().uuid(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const result = await conversationService.chat({
          conversationId: input.conversationId,
          message: input.message,
        });
        return {
          message: result.response,
          conversationId: result.conversationId,
        };
      }),

    chatStream: publicProcedure
      .input(
        z.object({
          conversationId: z.string().uuid(),
          message: z.string().min(1),
        })
      )
      .subscription(async function* ({ input }) {
        try {
          for await (const chunk of conversationService.chatStream({
            conversationId: input.conversationId,
            message: input.message,
          })) {
            yield {
              text: chunk.text,
              done: chunk.done,
              conversationId: chunk.conversationId,
            };
          }
        } catch {
          yield {
            text: "",
            done: true,
            conversationId: input.conversationId,
          };
        }
      }),
  });
}
