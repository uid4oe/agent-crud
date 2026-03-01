import { z } from "zod";
import type { NoteCategory , NoteService} from "../../domain/index.js";
import { NoteCategoryValues } from "../../domain/index.js";
import { publicProcedure, router } from "./trpc.js";

const noteCategorySchema = z.enum(NoteCategoryValues);

export function createNoteRouter(noteService: NoteService) {
  return router({
    list: publicProcedure
      .input(
        z
          .object({
            category: noteCategorySchema.optional(),
            tag: z.string().optional(),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
            sortBy: z.enum(["updatedAt", "createdAt", "title"]).optional(),
            sortOrder: z.enum(["asc", "desc"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const result = await noteService.list(
          {
            category: input?.category as NoteCategory | undefined,
            tag: input?.tag,
          },
          {
            limit: input?.limit ?? 50,
            offset: input?.offset ?? 0,
            sortBy: input?.sortBy,
            sortOrder: input?.sortOrder,
          }
        );
        return {
          data: result.data.map((n) => n.toJSON()),
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const note = await noteService.findById(input.id);
        return note ? note.toJSON() : null;
      }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          category: noteCategorySchema.optional(),
        })
      )
      .query(async ({ input }) => {
        const notes = await noteService.search(
          input.query,
          input.category as NoteCategory | undefined
        );
        return notes.map((n) => n.toJSON());
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string(),
          category: noteCategorySchema.optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const note = await noteService.create({
          title: input.title,
          content: input.content,
          category: input.category as NoteCategory | undefined,
          tags: input.tags,
        });
        return note.toJSON();
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().min(1).optional(),
          content: z.string().optional(),
          category: noteCategorySchema.optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const note = await noteService.update({
          id: input.id,
          title: input.title,
          content: input.content,
          category: input.category as NoteCategory | undefined,
          tags: input.tags,
        });
        return note.toJSON();
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const success = await noteService.delete({ id: input.id });
        return { success };
      }),

    getAllTags: publicProcedure.query(async () => {
      return noteService.getAllTags();
    }),

    bulkUpdate: publicProcedure
      .input(
        z.object({
          ids: z.array(z.string().uuid()).min(1).max(100),
          category: noteCategorySchema.optional(),
        })
      )
      .mutation(async ({ input }) => {
        const count = await noteService.bulkUpdate(input.ids, {
          category: input.category as NoteCategory | undefined,
        });
        return { count };
      }),

    bulkDelete: publicProcedure
      .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }))
      .mutation(async ({ input }) => {
        const count = await noteService.bulkDelete(input.ids);
        return { count };
      }),
  });
}
