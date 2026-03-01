import { FunctionTool } from "@google/adk";
import { z } from "zod";
import type { GoalCategory, GoalRepositoryPort, GoalStatus, UpdateGoalProps } from "../../../../domain/index.js";
import { params, safeExecute, type ToolArgs } from "./tool-helpers.js";

export function createGoalTools(
  goalRepository: GoalRepositoryPort
): FunctionTool[] {
  const listGoals = new FunctionTool({
    name: "list_goals",
    description: "List all goals, optionally filtered by status or category",
    parameters: params(
      z.object({
        status: z
          .enum(["active", "completed", "abandoned"])
          .optional()
          .describe("Optional filter by status: active, completed, or abandoned"),
        category: z
          .enum(["fitness", "nutrition", "mindfulness", "sleep", "other"])
          .optional()
          .describe("Optional filter by category"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { status, category } = args as {
        status?: GoalStatus;
        category?: GoalCategory;
      };

      let goals;
      if (status) {
        goals = await goalRepository.findByStatus(status);
      } else if (category) {
        goals = await goalRepository.findByCategory(category);
      } else {
        const result = await goalRepository.findAll();
        goals = result.data;
      }

      if (goals.length === 0) {
        if (status) return `No goals found with status "${status}"`;
        if (category) return `No goals found with category "${category}"`;
        return "No goals found in the system";
      }

      return JSON.stringify(goals.map((g) => g.toJSON()), null, 2);
    }),
  });

  const getGoalById = new FunctionTool({
    name: "get_goal_by_id",
    description: "Get a specific goal by its ID to view full details and milestones",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the goal to retrieve"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id } = args as { id: string };
      const goal = await goalRepository.findById(id);
      if (!goal) return `Goal with ID "${id}" not found`;
      return JSON.stringify(goal.toJSON(), null, 2);
    }),
  });

  const searchGoals = new FunctionTool({
    name: "search_goals",
    description: "Search goals by keyword in title or description",
    parameters: params(
      z.object({
        query: z.string().describe("Search term to find in goal title or description"),
        status: z
          .enum(["active", "completed", "abandoned"])
          .optional()
          .describe("Optional filter by status"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { query, status } = args as { query: string; status?: GoalStatus };
      const goals = await goalRepository.search(query, status);

      if (goals.length === 0) {
        return `No goals found matching "${query}"${status ? ` with status "${status}"` : ""}`;
      }

      return JSON.stringify(goals.map((g) => g.toJSON()), null, 2);
    }),
  });

  const getGoalStatistics = new FunctionTool({
    name: "get_goal_statistics",
    description: "Get statistics about goals: total count, counts by status and category, overall progress",
    parameters: params(z.object({})),
    execute: safeExecute(async () => {
      const result = await goalRepository.findAll();
      const allGoals = result.data;

      const stats = {
        total: allGoals.length,
        byStatus: {
          active: allGoals.filter((g) => g.status === "active").length,
          completed: allGoals.filter((g) => g.status === "completed").length,
          abandoned: allGoals.filter((g) => g.status === "abandoned").length,
        },
        byCategory: {
          fitness: allGoals.filter((g) => g.category === "fitness").length,
          nutrition: allGoals.filter((g) => g.category === "nutrition").length,
          mindfulness: allGoals.filter((g) => g.category === "mindfulness").length,
          sleep: allGoals.filter((g) => g.category === "sleep").length,
          other: allGoals.filter((g) => g.category === "other").length,
        },
        milestoneProgress: allGoals.map((g) => ({
          title: g.title,
          ...g.progress,
        })),
      };

      return JSON.stringify(stats, null, 2);
    }),
  });

  const createGoal = new FunctionTool({
    name: "create_goal",
    description: "Create a new wellness goal with optional milestones",
    parameters: params(
      z.object({
        title: z.string().describe("The title of the goal"),
        description: z.string().optional().describe("Detailed description of the goal"),
        category: z
          .enum(["fitness", "nutrition", "mindfulness", "sleep", "other"])
          .optional()
          .describe("Category (defaults to other)"),
        targetDate: z
          .string()
          .optional()
          .describe("Target completion date in ISO format (e.g. 2025-06-01)"),
        milestones: z
          .array(
            z.object({
              title: z.string().describe("Milestone title"),
            })
          )
          .optional()
          .describe("List of milestones for this goal"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { title, description, category, targetDate, milestones } = args as {
        title: string;
        description?: string;
        category?: string;
        targetDate?: string;
        milestones?: { title: string }[];
      };

      const goal = await goalRepository.create({
        title,
        description: description ?? null,
        status: "active",
        category: (category as GoalCategory) || "other",
        targetDate: targetDate ? new Date(targetDate) : null,
        milestones: milestones?.map((m, i) => ({
          title: m.title,
          sortOrder: i,
        })) ?? [],
      });

      return JSON.stringify(goal.toJSON(), null, 2);
    }),
  });

  const updateGoal = new FunctionTool({
    name: "update_goal",
    description: "Update an existing goal's properties or milestones",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the goal to update"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        status: z
          .enum(["active", "completed", "abandoned"])
          .optional()
          .describe("New status"),
        category: z
          .enum(["fitness", "nutrition", "mindfulness", "sleep", "other"])
          .optional()
          .describe("New category"),
        targetDate: z.string().optional().describe("New target date in ISO format"),
        milestones: z
          .array(
            z.object({
              title: z.string().describe("Milestone title"),
              completed: z.boolean().optional().describe("Whether milestone is done"),
            })
          )
          .optional()
          .describe("Replace milestones with this list"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id, title, description, status, category, targetDate, milestones } =
        args as {
          id: string;
          title?: string;
          description?: string;
          status?: string;
          category?: string;
          targetDate?: string;
          milestones?: { title: string; completed?: boolean }[];
        };

      const updateProps: UpdateGoalProps = {};
      if (title) updateProps.title = title;
      if (description !== undefined) updateProps.description = description;
      if (status) updateProps.status = status as GoalStatus;
      if (category) updateProps.category = category as GoalCategory;
      if (targetDate !== undefined)
        updateProps.targetDate = targetDate ? new Date(targetDate) : null;
      if (milestones)
        updateProps.milestones = milestones.map((m, i) => ({
          title: m.title,
          completed: m.completed ?? false,
          sortOrder: i,
        }));

      const updated = await goalRepository.update(id, updateProps);
      return updated
        ? JSON.stringify(updated.toJSON(), null, 2)
        : `Goal with ID "${id}" not found`;
    }),
  });

  const deleteGoal = new FunctionTool({
    name: "delete_goal",
    description: "Delete a goal and all its milestones by ID",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the goal to delete"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id } = args as { id: string };
      const goal = await goalRepository.findById(id);
      if (!goal) return `Goal with ID "${id}" not found`;

      await goalRepository.delete(id);
      return `Goal "${goal.title}" (${id}) deleted successfully`;
    }),
  });

  const toggleMilestone = new FunctionTool({
    name: "toggle_milestone",
    description: "Toggle a milestone's completion status within a goal",
    parameters: params(
      z.object({
        goalId: z.string().describe("The UUID of the goal"),
        milestoneId: z.string().describe("The UUID of the milestone to toggle"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { goalId, milestoneId } = args as {
        goalId: string;
        milestoneId: string;
      };

      const updated = await goalRepository.toggleMilestone(goalId, milestoneId);

      if (!updated) return `Goal with ID "${goalId}" or milestone with ID "${milestoneId}" not found`;
      return JSON.stringify(updated.toJSON(), null, 2);
    }),
  });

  return [
    listGoals,
    getGoalById,
    searchGoals,
    getGoalStatistics,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
  ];
}
