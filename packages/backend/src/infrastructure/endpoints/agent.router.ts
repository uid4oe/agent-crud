import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";
import {
  CreateConversationService,
  GetConversationService,
  ListConversationsService,
  DeleteConversationService,
  GetMessagesService,
  ChatService,
} from "../../domain/index.js";

export function createAgentRouter(
  createConversationService: CreateConversationService,
  getConversationService: GetConversationService,
  listConversationsService: ListConversationsService,
  deleteConversationService: DeleteConversationService,
  getMessagesService: GetMessagesService,
  chatService: ChatService
) {
  return router({
    createConversation: publicProcedure
      .input(z.object({ title: z.string().optional() }).optional())
      .mutation(async ({ input }) => {
        const { conversation } = await createConversationService.execute({
          title: input?.title,
        });
        return conversation.toJSON();
      }),

    getConversation: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const { conversation } = await getConversationService.execute({
          id: input.id,
        });
        return conversation ? conversation.toJSON() : null;
      }),

    listConversations: publicProcedure.query(async () => {
      const { conversations } = await listConversationsService.execute();
      return conversations.map((c) => c.toJSON());
    }),

    deleteConversation: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const { success } = await deleteConversationService.execute({
          id: input.id,
        });
        return { success };
      }),

    getMessages: publicProcedure
      .input(z.object({ conversationId: z.string().uuid() }))
      .query(async ({ input }) => {
        const { messages } = await getMessagesService.execute({
          conversationId: input.conversationId,
        });
        return messages.map((m) => m.toJSON());
      }),

    chat: publicProcedure
      .input(
        z.object({
          conversationId: z.string().uuid(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const result = await chatService.execute({
          conversationId: input.conversationId,
          message: input.message,
        });
        return {
          message: result.response,
          conversationId: result.conversationId,
        };
      }),
  });
}
