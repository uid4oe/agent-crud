import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";
import { TaskStatusValues, TaskPriorityValues } from "../../domain/index.js";
import type { TaskStatus, TaskPriority , TaskService} from "../../domain/index.js";

const taskStatusSchema = z.enum(TaskStatusValues);
const taskPrioritySchema = z.enum(TaskPriorityValues);

export function createTaskRouter(taskService: TaskService) {
  return router({
    list: publicProcedure
      .input(
        z
          .object({
            status: taskStatusSchema.optional(),
            priority: taskPrioritySchema.optional(),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
            sortBy: z.enum(["updatedAt", "createdAt", "title", "priority", "dueDate"]).optional(),
            sortOrder: z.enum(["asc", "desc"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const result = await taskService.list(
          { status: input?.status as TaskStatus | undefined },
          {
            limit: input?.limit ?? 50,
            offset: input?.offset ?? 0,
            sortBy: input?.sortBy,
            sortOrder: input?.sortOrder,
          }
        );
        return {
          data: result.data.map((t) => t.toJSON()),
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const task = await taskService.findById(input.id);
        return task ? task.toJSON() : null;
      }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          status: taskStatusSchema.optional(),
        })
      )
      .query(async ({ input }) => {
        const tasks = await taskService.search(
          input.query,
          input.status as TaskStatus | undefined
        );
        return tasks.map((t) => t.toJSON());
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          status: taskStatusSchema.optional(),
          priority: taskPrioritySchema.optional(),
          dueDate: z.string().nullable().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const task = await taskService.create({
          title: input.title,
          description: input.description,
          status: input.status as TaskStatus | undefined,
          priority: input.priority as TaskPriority | undefined,
          dueDate: input.dueDate,
          tags: input.tags,
        });
        return task.toJSON();
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          status: taskStatusSchema.optional(),
          priority: taskPrioritySchema.optional(),
          dueDate: z.string().nullable().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const task = await taskService.update({
          id: input.id,
          title: input.title,
          description: input.description,
          status: input.status as TaskStatus | undefined,
          priority: input.priority as TaskPriority | undefined,
          dueDate: input.dueDate,
          tags: input.tags,
        });
        return task.toJSON();
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const success = await taskService.delete({ id: input.id });
        return { success };
      }),

    bulkUpdate: publicProcedure
      .input(
        z.object({
          ids: z.array(z.string().uuid()).min(1).max(100),
          status: taskStatusSchema.optional(),
          priority: taskPrioritySchema.optional(),
        })
      )
      .mutation(async ({ input }) => {
        const count = await taskService.bulkUpdate(input.ids, {
          status: input.status as TaskStatus | undefined,
          priority: input.priority as TaskPriority | undefined,
        });
        return { count };
      }),

    bulkDelete: publicProcedure
      .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }))
      .mutation(async ({ input }) => {
        const count = await taskService.bulkDelete(input.ids);
        return { count };
      }),
  });
}
