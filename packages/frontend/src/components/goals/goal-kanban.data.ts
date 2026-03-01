import type { GoalStatus } from "../../types";
import type { KanbanColumn } from "../shared";

export const COLUMNS: KanbanColumn<GoalStatus>[] = [
  { key: "active", label: "Active", emptyText: "No active goals", color: "bg-blue-50/50" },
  { key: "completed", label: "Completed", emptyText: "No completed goals", color: "bg-emerald-50/50" },
  { key: "abandoned", label: "Abandoned", emptyText: "No abandoned goals", color: "bg-gray-50" },
];
