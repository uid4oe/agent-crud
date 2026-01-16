import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";
import {
  ListTasksService,
  GetTaskService,
  CreateTaskService,
  UpdateTaskService,
  DeleteTaskService,
  TaskStatus,
  TaskStatusValues,
} from "../../domain/index.js";

const taskStatusSchema = z.enum(TaskStatusValues);

export function createTaskRouter(
  listTasksService: ListTasksService,
  getTaskService: GetTaskService,
  createTaskService: CreateTaskService,
  updateTaskService: UpdateTaskService,
  deleteTaskService: DeleteTaskService
) {
  return router({
    list: publicProcedure.query(async () => {
      const { tasks } = await listTasksService.execute();
      return tasks.map((t) => t.toJSON());
    }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const { task } = await getTaskService.execute({ id: input.id });
        return task ? task.toJSON() : null;
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          status: taskStatusSchema.optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { task } = await createTaskService.execute({
          title: input.title,
          description: input.description,
          status: input.status as TaskStatus | undefined,
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
        })
      )
      .mutation(async ({ input }) => {
        const { task } = await updateTaskService.execute({
          id: input.id,
          title: input.title,
          description: input.description,
          status: input.status as TaskStatus | undefined,
        });
        return task ? task.toJSON() : null;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const { success } = await deleteTaskService.execute({ id: input.id });
        return { success };
      }),
  });
}
