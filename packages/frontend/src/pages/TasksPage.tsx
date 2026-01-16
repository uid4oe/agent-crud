import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { TaskTable, TaskForm, DeleteTaskDialog, EmptyState } from "../components/tasks";
import { useTasks } from "../hooks";
import type { Task, TaskFormData } from "../types";

export function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const { tasks, isLoading, error, createTask, updateTask, deleteTask: removeTask, isCreating, isUpdating, isDeleting } = useTasks();

  const handleCreate = async (data: TaskFormData) => {
    await createTask(data);
    setCreateOpen(false);
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (!editTask) return;
    await updateTask(editTask.id, data);
    setEditTask(null);
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    await removeTask(deleteTask.id);
    setDeleteTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {!tasks?.length ? (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <TaskTable tasks={tasks} onEdit={setEditTask} onDelete={setDeleteTask} />
      )}

      <TaskForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        title="Create Task"
        isLoading={isCreating}
      />

      {editTask && (
        <TaskForm
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          onSubmit={handleUpdate}
          initialData={{ title: editTask.title, description: editTask.description || "", status: editTask.status }}
          title="Edit Task"
          isLoading={isUpdating}
        />
      )}

      <DeleteTaskDialog task={deleteTask} onClose={() => setDeleteTask(null)} onConfirm={handleDelete} isLoading={isDeleting} />
    </div>
  );
}
