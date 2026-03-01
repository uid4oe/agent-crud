import type { Task, TaskStatus } from "../../types";
import { KanbanBoard } from "../shared";
import { TaskCard } from "./TaskCard";
import { COLUMNS } from "./task-kanban.data";

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
