import type { TaskStatus } from "../../types";
import type { KanbanColumn } from "../shared";

export const COLUMNS: KanbanColumn<TaskStatus>[] = [
  { key: "pending", label: "Pending", emptyText: "No pending tasks", color: "bg-amber-50/50" },
  { key: "in_progress", label: "In Progress", emptyText: "No tasks in progress", color: "bg-blue-50/50" },
  { key: "completed", label: "Completed", emptyText: "No completed tasks", color: "bg-emerald-50/50" },
];
