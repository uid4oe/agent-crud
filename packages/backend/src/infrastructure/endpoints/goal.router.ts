import { z } from "zod";
import { router, publicProcedure } from "./trpc.js";
import {
  GoalStatusValues,
  GoalCategoryValues,
} from "../../domain/index.js";
import type { GoalStatus, GoalCategory ,
  GoalService} from "../../domain/index.js";

const goalStatusSchema = z.enum(GoalStatusValues);
const goalCategorySchema = z.enum(GoalCategoryValues);

const milestoneInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  completed: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export function createGoalRouter(goalService: GoalService) {
  return router({
    list: publicProcedure
      .input(
        z
          .object({
            status: goalStatusSchema.optional(),
            category: goalCategorySchema.optional(),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
            sortBy: z.enum(["updatedAt", "createdAt", "title", "targetDate"]).optional(),
            sortOrder: z.enum(["asc", "desc"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const result = await goalService.list(
          {
            status: input?.status as GoalStatus | undefined,
            category: input?.category as GoalCategory | undefined,
          },
          {
            limit: input?.limit ?? 50,
            offset: input?.offset ?? 0,
            sortBy: input?.sortBy,
            sortOrder: input?.sortOrder,
          }
        );
        return {
          data: result.data.map((g) => g.toJSON()),
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const goal = await goalService.findById(input.id);
        return goal ? goal.toJSON() : null;
      }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          status: goalStatusSchema.optional(),
        })
      )
      .query(async ({ input }) => {
        const goals = await goalService.search(
          input.query,
          input.status as GoalStatus | undefined
        );
        return goals.map((g) => g.toJSON());
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().nullable().optional(),
          status: goalStatusSchema.optional(),
          category: goalCategorySchema.optional(),
          targetDate: z.string().nullable().optional(),
          milestones: z.array(milestoneInputSchema).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const goal = await goalService.create({
          title: input.title,
          description: input.description,
          status: input.status as GoalStatus | undefined,
          category: input.category as GoalCategory | undefined,
          targetDate: input.targetDate,
          milestones: input.milestones,
        });
        return goal.toJSON();
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().min(1).optional(),
          description: z.string().nullable().optional(),
          status: goalStatusSchema.optional(),
          category: goalCategorySchema.optional(),
          targetDate: z.string().nullable().optional(),
          milestones: z.array(milestoneInputSchema).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const goal = await goalService.update({
          id: input.id,
          title: input.title,
          description: input.description,
          status: input.status as GoalStatus | undefined,
          category: input.category as GoalCategory | undefined,
          targetDate: input.targetDate,
          milestones: input.milestones,
        });
        return goal.toJSON();
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const success = await goalService.delete({ id: input.id });
        return { success };
      }),

    toggleMilestone: publicProcedure
      .input(
        z.object({
          goalId: z.string().uuid(),
          milestoneId: z.string().uuid(),
        })
      )
      .mutation(async ({ input }) => {
        const goal = await goalService.toggleMilestone({
          goalId: input.goalId,
          milestoneId: input.milestoneId,
        });
        return goal.toJSON();
      }),

    bulkDelete: publicProcedure
      .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }))
      .mutation(async ({ input }) => {
        const count = await goalService.bulkDelete(input.ids);
        return { count };
      }),
  });
}
