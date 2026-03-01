import type { Goal, GoalStatus } from "../../types";
import { KanbanBoard as SharedKanbanBoard } from "../shared";
import { GoalCard } from "./GoalCard";
import { COLUMNS } from "./goal-kanban.data";

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
