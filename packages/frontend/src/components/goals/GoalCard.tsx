import { useCallback } from "react";
import { Pencil, Trash2, Calendar, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { cn, timeAgo } from "../../lib/utils";
import { MilestoneList } from "./MilestoneList";
import { CATEGORY_CONFIG } from "./goal-card.data";
import type { Goal } from "../../types";

export interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onToggleMilestone?: (goalId: string, milestoneId: string) => void;
  linkTo?: string;
  compact?: boolean;
}

export function GoalCard({ goal, onEdit, onDelete, onToggleMilestone, linkTo, compact }: GoalCardProps) {
  const config = CATEGORY_CONFIG[goal.category] ?? CATEGORY_CONFIG.other;
  const CategoryIcon = config.icon;
  const hasActions = onEdit || onDelete;

  const handleToggle = useCallback(
    (milestoneId: string) => {
      onToggleMilestone?.(goal.id, milestoneId);
    },
    [goal.id, onToggleMilestone]
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn("rounded-xl flex-shrink-0", config.color, compact ? "p-1.5" : "p-2")}>
          <CategoryIcon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </div>
        <div className="flex items-center gap-1">
          {hasActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit goal"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(goal); }}
                  className={cn(
                    "text-gray-500 hover:bg-surface hover:text-gray-900 rounded-full",
                    compact ? "h-7 w-7" : "h-8 w-8"
                  )}
                >
                  <Pencil className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete goal"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(goal); }}
                  className={cn(
                    "text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full",
                    compact ? "h-7 w-7" : "h-8 w-8"
                  )}
                >
                  <Trash2 className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </Button>
              )}
            </div>
          )}
          {linkTo && !hasActions && (
            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/card:text-gray-400 shrink-0 transition-all duration-150" />
          )}
        </div>
      </div>

      <h3
        className={cn(
          "font-semibold text-ink leading-snug",
          compact ? "text-sm mb-1" : "text-[15px] mb-1.5"
        )}
      >
        {goal.title}
      </h3>

      {goal.description && (
        <p
          className={cn(
            "leading-relaxed text-ink-secondary whitespace-pre-wrap",
            compact ? "text-xs line-clamp-2 mb-2.5" : "text-[13px] mb-3"
          )}
        >
          {goal.description}
        </p>
      )}

      {goal.milestones.length > 0 && (
        <div className={cn(compact ? "mb-2.5" : "mb-3")}>
          <MilestoneList
            milestones={goal.milestones}
            onToggle={onToggleMilestone ? handleToggle : undefined}
            compact={compact}
          />
        </div>
      )}

      <div
        className={cn(
          "flex items-end justify-between gap-2 mt-auto pt-2 border-t border-gray-50",
          compact && "items-center"
        )}
      >
        <div className={cn(compact ? "flex items-center gap-2" : "flex flex-col gap-0.5")}>
          <div
            className={cn(
              "font-medium text-gray-500 uppercase tracking-wider",
              compact ? "text-[10px]" : "text-[11px]"
            )}
          >
            {config.label}
          </div>
          {!compact && (
            <div className="text-[11px] text-gray-400">{timeAgo(goal.updatedAt || goal.createdAt)}</div>
          )}
        </div>

        {goal.targetDate && (
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <span className={cn(compact ? "text-[10px]" : "text-[11px]")}>
              {new Date(goal.targetDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {compact && !goal.targetDate && (
          <span className="ml-auto text-[11px] text-gray-400">
            {timeAgo(goal.updatedAt || goal.createdAt)}
          </span>
        )}
      </div>
    </>
  );

  const wrapperClassName = cn(
    "group group/card relative flex flex-col transition-all duration-200 border",
    compact
      ? "p-3.5 rounded-2xl bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-md"
      : "p-5 rounded-2xl bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
  );

  if (linkTo) {
    return <Link to={linkTo} className={wrapperClassName}>{content}</Link>;
  }

  return <div className={wrapperClassName}>{content}</div>;
}
