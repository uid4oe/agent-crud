import { FunctionTool } from "@google/adk";
import { z } from "zod";
import type { TaskPriority, TaskRepositoryPort, TaskStatus } from "../../../../domain/index.js";
import { params, safeExecute, type ToolArgs } from "./tool-helpers.js";

export function createTaskTools(
  taskRepository: TaskRepositoryPort
): FunctionTool[] {
  const listTasks = new FunctionTool({
    name: "list_tasks",
    description:
      "List all tasks in the system, optionally filtered by status",
    parameters: params(
      z.object({
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe(
            "Optional filter by status: pending, in_progress, or completed"
          ),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { status } = args as { status?: TaskStatus };
      let tasks;
      if (status) {
        tasks = await taskRepository.findByStatus(status);
      } else {
        const result = await taskRepository.findAll();
        tasks = result.data;
      }

      if (tasks.length === 0) {
        return status
          ? `No tasks found with status "${status}"`
          : "No tasks found in the system";
      }

      return JSON.stringify(
        tasks.map((t) => t.toJSON()),
        null,
        2
      );
    }),
  });

  const getTaskById = new FunctionTool({
    name: "get_task_by_id",
    description: "Get a specific task by its ID to view full details",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the task to retrieve"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id } = args as { id: string };
      const task = await taskRepository.findById(id);
      if (!task) {
        return `Task with ID "${id}" not found`;
      }
      return JSON.stringify(task.toJSON(), null, 2);
    }),
  });

  const searchTasks = new FunctionTool({
    name: "search_tasks",
    description: "Search tasks by keyword in title or description",
    parameters: params(
      z.object({
        query: z
          .string()
          .describe("Search term to find in task title or description"),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe(
            "Optional filter by status: pending, in_progress, or completed"
          ),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { query, status } = args as {
        query: string;
        status?: TaskStatus;
      };
      const tasks = await taskRepository.search(query, status);

      if (tasks.length === 0) {
        return `No tasks found matching "${query}"${status ? ` with status "${status}"` : ""}`;
      }

      return JSON.stringify(
        tasks.map((t) => t.toJSON()),
        null,
        2
      );
    }),
  });

  const getTaskStatistics = new FunctionTool({
    name: "get_task_statistics",
    description:
      "Get statistics about tasks: total count, counts by status, recent activity",
    parameters: params(z.object({})),
    execute: safeExecute(async () => {
      const result = await taskRepository.findAll();
      const allTasks = result.data;

      const stats = {
        total: allTasks.length,
        byStatus: {
          pending: allTasks.filter((t) => t.status === "pending").length,
          in_progress: allTasks.filter((t) => t.status === "in_progress")
            .length,
          completed: allTasks.filter((t) => t.status === "completed").length,
        },
        completionRate:
          allTasks.length > 0
            ? Math.round(
                (allTasks.filter((t) => t.status === "completed").length /
                  allTasks.length) *
                  100
              )
            : 0,
        recentTasks: [...allTasks]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map((t) => ({
            title: t.title,
            status: t.status,
            createdAt: t.createdAt,
          })),
      };

      return JSON.stringify(stats, null, 2);
    }),
  });

  const createTask = new FunctionTool({
    name: "create_task",
    description: "Create a new task",
    parameters: params(
      z.object({
        title: z.string().describe("The title of the task"),
        description: z
          .string()
          .optional()
          .describe("Optional description of the task"),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe(
            "Status of the task: pending, in_progress, or completed"
          ),
        priority: z
          .enum(["low", "normal", "high"])
          .optional()
          .describe("Priority of the task: low, normal, or high"),
        dueDate: z
          .string()
          .optional()
          .describe("Due date for the task in ISO 8601 format (e.g. 2024-12-31)"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Tags for the task"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { title, description, status, priority, dueDate, tags } = args as {
        title: string;
        description?: string;
        status?: string;
        priority?: string;
        dueDate?: string;
        tags?: string[];
      };
      const task = await taskRepository.create({
        title,
        description,
        status: (status as TaskStatus) || "pending",
        priority: (priority as TaskPriority) || "normal",
        dueDate,
        tags,
      });
      return JSON.stringify(task.toJSON(), null, 2);
    }),
  });

  const updateTask = new FunctionTool({
    name: "update_task",
    description: "Update an existing task",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the task to update"),
        title: z.string().optional().describe("New title for the task"),
        description: z
          .string()
          .optional()
          .describe("New description for the task"),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe("New status: pending, in_progress, or completed"),
        priority: z
          .enum(["low", "normal", "high"])
          .optional()
          .describe("New priority: low, normal, or high"),
        dueDate: z
          .string()
          .optional()
          .describe("New due date in ISO 8601 format"),
        tags: z
          .array(z.string())
          .optional()
          .describe("New tags for the task"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id, title, description, status, priority, dueDate, tags } = args as {
        id: string;
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        dueDate?: string;
        tags?: string[];
      };
      const updateProps: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: string;
        tags?: string[];
      } = {};

      if (title) updateProps.title = title;
      if (description !== undefined) updateProps.description = description;
      if (status) updateProps.status = status as TaskStatus;
      if (priority) updateProps.priority = priority as TaskPriority;
      if (dueDate !== undefined) updateProps.dueDate = dueDate;
      if (tags !== undefined) updateProps.tags = tags;

      const updated = await taskRepository.update(id, updateProps);
      return updated
        ? JSON.stringify(updated.toJSON(), null, 2)
        : `Task with ID "${id}" not found`;
    }),
  });

  const deleteTask = new FunctionTool({
    name: "delete_task",
    description: "Delete a task by ID",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the task to delete"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id } = args as { id: string };
      const task = await taskRepository.findById(id);
      if (!task) {
        return `Task with ID "${id}" not found`;
      }

      await taskRepository.delete(id);
      return `Task "${task.title}" (${id}) deleted successfully`;
    }),
  });

  const bulkUpdateTasks = new FunctionTool({
    name: "bulk_update_tasks",
    description:
      "Update multiple tasks at once. Use this when the user wants to change the status, priority, or tags of several tasks (e.g. 'mark all pending tasks as completed').",
    parameters: params(
      z.object({
        ids: z.array(z.string()).describe("Array of task UUIDs to update"),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe("New status for all tasks"),
        priority: z
          .enum(["low", "normal", "high"])
          .optional()
          .describe("New priority for all tasks"),
        tags: z
          .array(z.string())
          .optional()
          .describe("New tags for all tasks"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { ids, status, priority, tags } = args as {
        ids: string[];
        status?: string;
        priority?: string;
        tags?: string[];
      };

      const updateProps: {
        status?: TaskStatus;
        priority?: TaskPriority;
        tags?: string[];
      } = {};
      if (status) updateProps.status = status as TaskStatus;
      if (priority) updateProps.priority = priority as TaskPriority;
      if (tags !== undefined) updateProps.tags = tags;

      const count = await taskRepository.bulkUpdate(ids, updateProps);
      return `Successfully updated ${count} of ${ids.length} tasks`;
    }),
  });

  return [
    listTasks,
    getTaskById,
    searchTasks,
    getTaskStatistics,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
  ];
}
