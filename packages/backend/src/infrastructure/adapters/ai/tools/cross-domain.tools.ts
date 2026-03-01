import { FunctionTool } from "@google/adk";
import { z } from "zod";
import type {
  TaskRepositoryPort,
  NoteRepositoryPort,
  GoalRepositoryPort,
  TaskStatus,
  TaskPriority,
  NoteCategory,
  GoalStatus,
  GoalCategory,
} from "../../../../domain/index.js";
import { params, safeExecute, type ToolArgs } from "./tool-helpers.js";

export function createCrossDomainTools(deps: {
  taskRepository?: TaskRepositoryPort;
  noteRepository?: NoteRepositoryPort;
  goalRepository?: GoalRepositoryPort;
}): FunctionTool[] {
  const tools: FunctionTool[] = [];

  // ---------------------------------------------------------------------------
  // Task cross-domain tools (for NoteAgent and GoalAgent)
  // ---------------------------------------------------------------------------

  if (deps.taskRepository) {
    tools.push(
      new FunctionTool({
        name: "search_other_tasks",
        description:
          "Search tasks from another domain for cross-referencing (read-only). Use this to find related tasks.",
        parameters: params(
          z.object({
            query: z.string().describe("Search term to find in task title or description"),
          })
        ),
        execute: safeExecute(async (args: ToolArgs) => {
          const { query } = args as { query: string };
          const tasks = await deps.taskRepository!.search(query);
          if (tasks.length === 0) return `No tasks found matching "${query}"`;
          return JSON.stringify(
            tasks.slice(0, 5).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
            })),
            null,
            2
          );
        }),
      })
    );

    tools.push(
      new FunctionTool({
        name: "create_other_task",
        description:
          "Create a task from another domain agent. Use this when the user asks you to also create tasks as part of a compound request.",
        parameters: params(
          z.object({
            title: z.string().describe("The title of the task"),
            description: z.string().optional().describe("Optional description"),
            status: z.enum(["pending", "in_progress", "completed"]).optional().describe("Status (defaults to pending)"),
            priority: z.enum(["low", "normal", "high"]).optional().describe("Priority (defaults to normal)"),
            tags: z.array(z.string()).optional().describe("Tags for the task"),
          })
        ),
        execute: safeExecute(async (args: ToolArgs) => {
          const { title, description, status, priority, tags } = args as {
            title: string;
            description?: string;
            status?: string;
            priority?: string;
            tags?: string[];
          };
          const task = await deps.taskRepository!.create({
            title,
            description,
            status: (status as TaskStatus) || "pending",
            priority: (priority as TaskPriority) || "normal",
            tags,
          });
          return JSON.stringify(task.toJSON(), null, 2);
        }),
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Note cross-domain tools (for TaskAgent and GoalAgent)
  // ---------------------------------------------------------------------------

  if (deps.noteRepository) {
    tools.push(
      new FunctionTool({
        name: "search_other_notes",
        description:
          "Search notes from another domain for cross-referencing (read-only). Use this to find related notes.",
        parameters: params(
          z.object({
            query: z.string().describe("Search term to find in note title or content"),
          })
        ),
        execute: safeExecute(async (args: ToolArgs) => {
          const { query } = args as { query: string };
          const notes = await deps.noteRepository!.search(query);
          if (notes.length === 0) return `No notes found matching "${query}"`;
          return JSON.stringify(
            notes.slice(0, 5).map((n) => ({
              id: n.id,
              title: n.title,
              category: n.category,
              tags: n.tags,
            })),
            null,
            2
          );
        }),
      })
    );

    tools.push(
      new FunctionTool({
        name: "create_other_note",
        description:
          "Create a note from another domain agent. Use this when the user asks you to also create a note as part of a compound request.",
        parameters: params(
          z.object({
            title: z.string().describe("The title of the note"),
            content: z.string().describe("The content of the note"),
            category: z.enum(["general", "idea", "reference", "meeting", "personal"]).optional().describe("Category (defaults to general)"),
            tags: z.array(z.string()).optional().describe("Tags for the note"),
          })
        ),
        execute: safeExecute(async (args: ToolArgs) => {
          const { title, content, category, tags } = args as {
            title: string;
            content: string;
            category?: string;
            tags?: string[];
          };
          const note = await deps.noteRepository!.create({
            title,
            content,
            category: (category as NoteCategory) || "general",
            tags,
          });
          return JSON.stringify(note.toJSON(), null, 2);
        }),
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Goal cross-domain tools (for TaskAgent and NoteAgent)
  // ---------------------------------------------------------------------------

  if (deps.goalRepository) {
    tools.push(
      new FunctionTool({
        name: "search_other_goals",
        description:
          "Search goals from another domain for cross-referencing (read-only). Use this to find related goals.",
        parameters: params(
          z.object({
            query: z.string().describe("Search term to find in goal title or description"),
          })
        ),
        execute: safeExecute(async (args: ToolArgs) => {
          const { query } = args as { query: string };
          const goals = await deps.goalRepository!.search(query);
          if (goals.length === 0) return `No goals found matching "${query}"`;
          return JSON.stringify(
            goals.slice(0, 5).map((g) => ({
              id: g.id,
              title: g.title,
              status: g.status,
              category: g.category,
            })),
            null,
            2
          );
        }),
      })
    );

    tools.push(
      new FunctionTool({
        name: "create_other_goal",
        description:
          "Create a goal from another domain agent. Use this when the user asks you to also create a goal as part of a compound request.",
        parameters: params(
          z.object({
            title: z.string().describe("The title of the goal"),
            description: z.string().optional().describe("Optional description"),
            category: z.enum(["fitness", "nutrition", "mindfulness", "sleep", "other"]).optional().describe("Category (defaults to other)"),
            status: z.enum(["active", "completed", "abandoned"]).optional().describe("Status (defaults to active)"),
          })
        ),
        execute: safeExecute(async (args: ToolArgs) => {
          const { title, description, category, status } = args as {
            title: string;
            description?: string;
            category?: string;
            status?: string;
          };
          const goal = await deps.goalRepository!.create({
            title,
            description,
            category: (category as GoalCategory) || "other",
            status: (status as GoalStatus) || "active",
          });
          return JSON.stringify(goal.toJSON(), null, 2);
        }),
      })
    );
  }

  return tools;
}
