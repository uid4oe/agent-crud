import { useToast } from "../app/providers/ToastProvider";
import { trpc } from "../lib/trpc";
import type { TaskFormSchema } from "../lib/validation";
import type { TaskStatus } from "../types";

function parseTags(tagsString: string): string[] {
  return tagsString.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
}

interface UseTasksOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useTasks(options: UseTasksOptions = {}) {
  const utils = trpc.useUtils();
  const { addToast } = useToast();

  const queryInput = {
    ...(options.sortBy && { sortBy: options.sortBy as "updatedAt" | "createdAt" | "title" | "priority" | "dueDate" }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  };

  const { data: response, isLoading, error } = trpc.task.list.useQuery(
    Object.keys(queryInput).length > 0 ? queryInput : undefined
  );

  const tasks = response?.data ?? response;

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
    onError: () => addToast("Failed to create task. Please try again.", "error"),
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
    onError: () => addToast("Failed to update task. Please try again.", "error"),
  });

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
    onError: () => addToast("Failed to delete task. Please try again.", "error"),
  });

  const bulkDeleteMutation = trpc.task.bulkDelete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
    onError: () => addToast("Failed to delete tasks. Please try again.", "error"),
  });

  const createTask = (data: TaskFormSchema) =>
    createMutation.mutateAsync({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate || null,
      tags: parseTags(data.tags),
    });

  const updateTask = (id: string, data: TaskFormSchema) =>
    updateMutation.mutateAsync({
      id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate || null,
      tags: parseTags(data.tags),
    });

  const moveTask = (id: string, status: TaskStatus) => updateMutation.mutateAsync({ id, status });
  const deleteTask = (id: string) => deleteMutation.mutateAsync({ id });
  const bulkDeleteTasks = (ids: string[]) => bulkDeleteMutation.mutateAsync({ ids });

  return {
    tasks: tasks as import("../types").Task[] | undefined,
    isLoading,
    error,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    bulkDeleteTasks,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
