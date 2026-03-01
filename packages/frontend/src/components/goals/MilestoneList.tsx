import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Milestone } from "../../types";

interface MilestoneListProps {
  milestones: Milestone[];
  onToggle?: (milestoneId: string) => void;
  compact?: boolean;
}

export function MilestoneList({ milestones, onToggle, compact }: MilestoneListProps) {
  if (milestones.length === 0) return null;

  const completed = milestones.filter((m) => m.completed).length;
  const percentage = Math.round((completed / milestones.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn("text-gray-500 font-medium", compact ? "text-[10px]" : "text-xs")}>
          {completed}/{milestones.length}
        </span>
      </div>
      <ul className="space-y-1">
        {milestones
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, compact ? 3 : undefined)
          .map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggle?.(m.id); }}
                disabled={!onToggle}
                className={cn(
                  "flex-shrink-0 rounded-md border transition-all duration-150",
                  compact ? "h-4 w-4" : "h-5 w-5",
                  m.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-300 hover:border-gray-400",
                  !onToggle && "cursor-default"
                )}
              >
                {m.completed && <Check className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5", "m-auto")} />}
              </button>
              <span
                className={cn(
                  "leading-tight",
                  compact ? "text-xs" : "text-sm",
                  m.completed && "line-through text-gray-400"
                )}
              >
                {m.title}
              </span>
            </li>
          ))}
        {compact && milestones.length > 3 && (
          <li className="text-[10px] text-gray-400 pl-6">
            +{milestones.length - 3} more
          </li>
        )}
      </ul>
    </div>
  );
}
