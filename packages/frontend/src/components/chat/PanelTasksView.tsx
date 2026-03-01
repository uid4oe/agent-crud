import { ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import { useTasks } from "../../hooks";
import type { TaskFormSchema } from "../../lib/validation";
import type { Task } from "../../types";
import { DeleteDialog, EmptyResourceState } from "../feedback";
import { TaskForm, TaskKanban } from "../tasks";

export function PanelTasksView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const { tasks, isLoading, createTask, updateTask, moveTask, deleteTask: removeTask, isCreating, isUpdating, isDeleting } = useTasks();

  const handleCreate = async (data: TaskFormSchema) => {
    await createTask(data);
    setCreateOpen(false);
  };

  const handleUpdate = async (data: TaskFormSchema) => {
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
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-gray-500">{tasks?.length || 0} tasks</span>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-foreground bg-purple hover:bg-purple-hover rounded-full transition-all duration-200 active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {tasks && tasks.length > 0 ? (
          <TaskKanban
            tasks={tasks}
            onEdit={setEditTask}
            onDelete={setDeleteTask}
            onToggleStatus={(task, newStatus) => moveTask(task.id, newStatus)}
            onMoveToStatus={(task, newStatus) => moveTask(task.id, newStatus)}
          />
        ) : (
          <div className="px-2">
            <EmptyResourceState
              icon={ListTodo}
              title="No tasks yet"
              description="Get started by creating your first task to keep track of what you need to do."
              createLabel="Create Task"
              onCreateClick={() => setCreateOpen(true)}
            />
          </div>
        )}
      </div>

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

      <DeleteDialog
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        resourceType="Task"
        resourceName={deleteTask?.title}
      />
    </div>
  );
}
