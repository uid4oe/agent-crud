import { TaskRepositoryPort, TaskStatus } from "../../../../domain/index.js";

export interface ToolExecutor {
  execute(name: string, args: Record<string, unknown>): Promise<string>;
}

export class TaskToolExecutor implements ToolExecutor {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const handler = this.handlers[name];
    if (!handler) {
      return `Unknown tool: ${name}`;
    }
    return handler(args);
  }

  private handlers: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
    listTasks: async (args) => {
      const status = args.status as TaskStatus | undefined;
      const tasks = status
        ? await this.taskRepository.findByStatus(status)
        : await this.taskRepository.findAll();

      if (tasks.length === 0) {
        return status
          ? `No tasks found with status "${status}"`
          : "No tasks found in the system";
      }

      return JSON.stringify(tasks.map((t) => t.toJSON()), null, 2);
    },

    getTaskById: async (args) => {
      const task = await this.taskRepository.findById(args.id as string);
      if (!task) {
        return `Task with ID "${args.id}" not found`;
      }
      return JSON.stringify(task.toJSON(), null, 2);
    },

    searchTasks: async (args) => {
      const query = args.query as string;
      const status = args.status as TaskStatus | undefined;
      const tasks = await this.taskRepository.search(query, status);

      if (tasks.length === 0) {
        return `No tasks found matching "${query}"${status ? ` with status "${status}"` : ""}`;
      }

      return JSON.stringify(tasks.map((t) => t.toJSON()), null, 2);
    },

    getTaskStatistics: async () => {
      const allTasks = await this.taskRepository.findAll();

      const stats = {
        total: allTasks.length,
        byStatus: {
          pending: allTasks.filter((t) => t.status === "pending").length,
          in_progress: allTasks.filter((t) => t.status === "in_progress").length,
          completed: allTasks.filter((t) => t.status === "completed").length,
        },
        completionRate:
          allTasks.length > 0
            ? Math.round(
                (allTasks.filter((t) => t.status === "completed").length / allTasks.length) * 100
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
    },

    createTask: async (args) => {
      const task = await this.taskRepository.create({
        title: args.title as string,
        description: args.description as string | undefined,
        status: (args.status as TaskStatus) || "pending",
      });
      return JSON.stringify(task.toJSON(), null, 2);
    },

    updateTask: async (args) => {
      const updateProps: { title?: string; description?: string; status?: TaskStatus } = {};

      if (args.title) updateProps.title = args.title as string;
      if (args.description !== undefined) updateProps.description = args.description as string;
      if (args.status) updateProps.status = args.status as TaskStatus;

      const updated = await this.taskRepository.update(args.id as string, updateProps);
      return updated ? JSON.stringify(updated.toJSON(), null, 2) : "Task not found";
    },

    deleteTask: async (args) => {
      const task = await this.taskRepository.findById(args.id as string);
      if (!task) {
        return `Task with ID "${args.id}" not found`;
      }

      await this.taskRepository.delete(args.id as string);
      return `Task "${task.title}" (${args.id}) deleted successfully`;
    },
  };
}
