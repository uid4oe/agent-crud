import { trpc } from "../lib/trpc";
import type { TaskFormData } from "../types";

export function useTasks() {
  const utils = trpc.useUtils();

  const { data: tasks, isLoading, error } = trpc.task.list.useQuery();

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const createTask = (data: TaskFormData) => createMutation.mutateAsync(data);
  const updateTask = (id: string, data: TaskFormData) => updateMutation.mutateAsync({ id, ...data });
  const deleteTask = (id: string) => deleteMutation.mutateAsync({ id });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
