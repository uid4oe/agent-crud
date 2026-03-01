import { KanbanBoard as SharedKanbanBoard } from "../shared";
import type { KanbanColumn } from "../shared";
import { GoalCard } from "./GoalCard";
import type { Goal, GoalStatus } from "../../types";

const COLUMNS: KanbanColumn<GoalStatus>[] = [
  { key: "active", label: "Active", emptyText: "No active goals", color: "bg-blue-50/50" },
  { key: "completed", label: "Completed", emptyText: "No completed goals", color: "bg-emerald-50/50" },
  { key: "abandoned", label: "Abandoned", emptyText: "No abandoned goals", color: "bg-gray-50" },
];

interface GoalKanbanBoardProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onMoveToStatus?: (goal: Goal, newStatus: GoalStatus) => void;
}

export function GoalKanbanBoard({ goals, onEdit, onDelete, onToggleMilestone, onMoveToStatus }: GoalKanbanBoardProps) {
  return (
    <SharedKanbanBoard
      items={goals}
      columns={COLUMNS}
      getColumnKey={(goal) => goal.status}
      getItemKey={(goal) => goal.id}
      renderItem={(goal) => (
        <GoalCard
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleMilestone={onToggleMilestone}
        />
      )}
      onItemMoved={onMoveToStatus ? (goal, _from, to) => onMoveToStatus(goal, to) : undefined}
    />
  );
}
