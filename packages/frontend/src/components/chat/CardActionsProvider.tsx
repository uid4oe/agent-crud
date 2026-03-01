import { createContext, type ReactNode, useContext, useState } from "react";
import { useGoals, useNotes, useTasks } from "../../hooks";
import type { GoalFormSchema, NoteFormSchema, TaskFormSchema } from "../../lib/validation";
import type { Goal, Note, Task, TaskStatus } from "../../types";
import { DeleteDialog } from "../feedback/DeleteDialog";
import { GoalForm } from "../goals/GoalForm";
import { NoteForm } from "../notes/NoteForm";
import { TaskForm } from "../tasks/TaskForm";

export interface CardActions {
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskStatus: (task: Task, newStatus: TaskStatus) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

const CardActionsContext = createContext<CardActions | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCardActions(): CardActions | null {
  return useContext(CardActionsContext);
}

export function CardActionsProvider({ children }: { children: ReactNode }) {
  const { updateTask, deleteTask, isUpdating: isUpdatingTask, isDeleting: isDeletingTask } = useTasks();
  const { updateNote, deleteNote, isUpdating: isUpdatingNote, isDeleting: isDeletingNote } = useNotes();
  const { updateGoal, deleteGoal: removeGoal, toggleMilestone, isUpdating: isUpdatingGoal, isDeleting: isDeletingGoal } = useGoals();

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<Note | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoalTarget, setDeleteGoalTarget] = useState<Goal | null>(null);

  const handleUpdateTask = async (data: TaskFormSchema) => {
    if (!editTask) return;
    await updateTask(editTask.id, data);
    setEditTask(null);
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    await deleteTask(deleteTaskTarget.id);
    setDeleteTaskTarget(null);
  };

  const handleUpdateNote = async (data: NoteFormSchema) => {
    if (!editNote) return;
    await updateNote(editNote.id, data);
    setEditNote(null);
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteTarget) return;
    await deleteNote(deleteNoteTarget.id);
    setDeleteNoteTarget(null);
  };

  const handleUpdateGoal = async (data: GoalFormSchema) => {
    if (!editGoal) return;
    await updateGoal(editGoal.id, data);
    setEditGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalTarget) return;
    await removeGoal(deleteGoalTarget.id);
    setDeleteGoalTarget(null);
  };

  const actions: CardActions = {
    onEditTask: setEditTask,
    onDeleteTask: setDeleteTaskTarget,
    onToggleTaskStatus: (task, newStatus) =>
      updateTask(task.id, {
        title: task.title,
        description: task.description || "",
        status: newStatus,
        priority: task.priority ?? "normal",
        tags: task.tags?.join(", ") ?? "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      }),
    onEditNote: setEditNote,
    onDeleteNote: setDeleteNoteTarget,
    onEditGoal: setEditGoal,
    onDeleteGoal: setDeleteGoalTarget,
    onToggleMilestone: (goalId, milestoneId) => toggleMilestone(goalId, milestoneId),
  };

  return (
    <CardActionsContext.Provider value={actions}>
      {children}

      {editTask && (
        <TaskForm
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          onSubmit={handleUpdateTask}
          initialData={{ title: editTask.title, description: editTask.description || "", status: editTask.status }}
          title="Edit Task"
          isLoading={isUpdatingTask}
        />
      )}

      <DeleteDialog
        open={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleDeleteTask}
        isLoading={isDeletingTask}
        resourceType="Task"
        resourceName={deleteTaskTarget?.title}
      />

      {editNote && (
        <NoteForm
          open={!!editNote}
          onOpenChange={(open) => !open && setEditNote(null)}
          onSubmit={handleUpdateNote}
          initialData={{
            title: editNote.title,
            content: editNote.content,
            category: editNote.category,
            tags: editNote.tags.join(", "),
          }}
          title="Edit Note"
          isLoading={isUpdatingNote}
        />
      )}

      <DeleteDialog
        open={!!deleteNoteTarget}
        onClose={() => setDeleteNoteTarget(null)}
        onConfirm={handleDeleteNote}
        isLoading={isDeletingNote}
        resourceType="Note"
        resourceName={deleteNoteTarget?.title}
      />

      {editGoal && (
        <GoalForm
          open={!!editGoal}
          onOpenChange={(open) => !open && setEditGoal(null)}
          onSubmit={handleUpdateGoal}
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
          isLoading={isUpdatingGoal}
        />
      )}

      <DeleteDialog
        open={!!deleteGoalTarget}
        onClose={() => setDeleteGoalTarget(null)}
        onConfirm={handleDeleteGoal}
        isLoading={isDeletingGoal}
        resourceType="Goal"
        resourceName={deleteGoalTarget?.title}
      />
    </CardActionsContext.Provider>
  );
}
