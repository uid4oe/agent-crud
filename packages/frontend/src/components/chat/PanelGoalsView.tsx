import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { useGoals } from "../../hooks";
import type { GoalFormSchema } from "../../lib/validation";
import type { Goal } from "../../types";
import { DeleteDialog, EmptyResourceState } from "../feedback";
import { GoalForm, GoalKanbanBoard } from "../goals";

export function PanelGoalsView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);

  const { goals, isLoading, createGoal, updateGoal, moveGoal, deleteGoal: removeGoal, toggleMilestone, isCreating, isUpdating, isDeleting } = useGoals();

  const handleCreate = async (data: GoalFormSchema) => {
    await createGoal(data);
    setCreateOpen(false);
  };

  const handleUpdate = async (data: GoalFormSchema) => {
    if (!editGoal) return;
    await updateGoal(editGoal.id, data);
    setEditGoal(null);
  };

  const handleDelete = async () => {
    if (!deleteGoal) return;
    await removeGoal(deleteGoal.id);
    setDeleteGoal(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-gray-500">{goals?.length || 0} goals</span>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-foreground bg-purple hover:bg-purple-hover rounded-full transition-all duration-200 active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {goals && goals.length > 0 ? (
          <GoalKanbanBoard
            goals={goals}
            onEdit={setEditGoal}
            onDelete={setDeleteGoal}
            onToggleMilestone={toggleMilestone}
            onMoveToStatus={(goal, status) => moveGoal(goal.id, status)}
          />
        ) : (
          <div className="px-2">
            <EmptyResourceState
              icon={Target}
              title="No goals yet"
              description="Get started by creating your first goal to track your fitness, nutrition, mindfulness, and sleep habits."
              createLabel="Create Goal"
              onCreateClick={() => setCreateOpen(true)}
            />
          </div>
        )}
      </div>

      <GoalForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        title="Create Goal"
        isLoading={isCreating}
      />

      {editGoal && (
        <GoalForm
          open={!!editGoal}
          onOpenChange={(open) => !open && setEditGoal(null)}
          onSubmit={handleUpdate}
          initialData={{
            title: editGoal.title,
            description: editGoal.description || "",
            status: editGoal.status,
            category: editGoal.category,
            targetDate: editGoal.targetDate
              ? new Date(editGoal.targetDate).toISOString().split("T")[0]
              : "",
            milestones: editGoal.milestones
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((m) => ({ id: m.id, title: m.title, completed: m.completed })),
          }}
          title="Edit Goal"
          isLoading={isUpdating}
        />
      )}

      <DeleteDialog
        open={!!deleteGoal}
        onClose={() => setDeleteGoal(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        resourceType="Goal"
        resourceName={deleteGoal?.title}
      />
    </div>
  );
}
