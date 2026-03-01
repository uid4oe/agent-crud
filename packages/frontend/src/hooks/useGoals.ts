import { useToast } from "../app/providers/ToastProvider";
import { trpc } from "../lib/trpc";
import type { GoalFormSchema } from "../lib/validation";
import type { GoalStatus } from "../types";

interface UseGoalsOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useGoals(options: UseGoalsOptions = {}) {
  const utils = trpc.useUtils();
  const { addToast } = useToast();

  const queryInput = {
    ...(options.sortBy && { sortBy: options.sortBy as "updatedAt" | "createdAt" | "title" | "targetDate" }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  };

  const { data: response, isLoading, error } = trpc.goal.list.useQuery(
    Object.keys(queryInput).length > 0 ? queryInput : undefined
  );

  const goals = response?.data ?? response;

  const createMutation = trpc.goal.create.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: () => addToast("Failed to create goal. Please try again.", "error"),
  });

  const updateMutation = trpc.goal.update.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: () => addToast("Failed to update goal. Please try again.", "error"),
  });

  const deleteMutation = trpc.goal.delete.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: () => addToast("Failed to delete goal. Please try again.", "error"),
  });

  const toggleMilestoneMutation = trpc.goal.toggleMilestone.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: () => addToast("Failed to update milestone. Please try again.", "error"),
  });

  const bulkDeleteMutation = trpc.goal.bulkDelete.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: () => addToast("Failed to delete goals. Please try again.", "error"),
  });

  const createGoal = (data: GoalFormSchema) =>
    createMutation.mutateAsync({
      title: data.title,
      description: data.description || null,
      status: data.status,
      category: data.category,
      targetDate: data.targetDate || null,
      milestones: data.milestones,
    });

  const updateGoal = (id: string, data: GoalFormSchema) =>
    updateMutation.mutateAsync({
      id,
      title: data.title,
      description: data.description || null,
      status: data.status,
      category: data.category,
      targetDate: data.targetDate || null,
      milestones: data.milestones,
    });

  const moveGoal = (id: string, status: GoalStatus) => updateMutation.mutateAsync({ id, status });
  const deleteGoal = (id: string) => deleteMutation.mutateAsync({ id });
  const toggleMilestone = (goalId: string, milestoneId: string) =>
    toggleMilestoneMutation.mutateAsync({ goalId, milestoneId });
  const bulkDeleteGoals = (ids: string[]) => bulkDeleteMutation.mutateAsync({ ids });

  return {
    goals: goals as import("../types").Goal[] | undefined,
    isLoading,
    error,
    createGoal,
    updateGoal,
    moveGoal,
    deleteGoal,
    toggleMilestone,
    bulkDeleteGoals,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingMilestone: toggleMilestoneMutation.isPending,
  };
}
