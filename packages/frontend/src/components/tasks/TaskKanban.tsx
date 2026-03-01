import { KanbanBoard } from "../shared";
import type { KanbanColumn } from "../shared";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "../../types";

const COLUMNS: KanbanColumn<TaskStatus>[] = [
  { key: "pending", label: "Pending", emptyText: "No pending tasks", color: "bg-amber-50/50" },
  { key: "in_progress", label: "In Progress", emptyText: "No tasks in progress", color: "bg-blue-50/50" },
  { key: "completed", label: "Completed", emptyText: "No completed tasks", color: "bg-emerald-50/50" },
];

interface TaskKanbanProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleStatus: (task: Task, newStatus: TaskStatus) => void;
  onMoveToStatus?: (task: Task, newStatus: TaskStatus) => void;
}

export function TaskKanban({ tasks, onEdit, onDelete, onToggleStatus, onMoveToStatus }: TaskKanbanProps) {
  return (
    <KanbanBoard
      items={tasks}
      columns={COLUMNS}
      getColumnKey={(task) => task.status}
      getItemKey={(task) => task.id}
      renderItem={(task) => (
        <TaskCard
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusToggle={onToggleStatus}
        />
      )}
      onItemMoved={onMoveToStatus ? (task, _from, to) => onMoveToStatus(task, to) : undefined}
    />
  );
}
