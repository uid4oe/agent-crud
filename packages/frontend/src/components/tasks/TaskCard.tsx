import { Pencil, Trash2, CheckCircle2, Clock, Loader2, ExternalLink, AlertTriangle, ArrowDown, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn, timeAgo } from "../../lib/utils";
import type { Task, TaskStatus, TaskPriority } from "../../types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Clock }> = {
  pending: { label: "Pending", icon: Clock },
  in_progress: { label: "In Progress", icon: Loader2 },
  completed: { label: "Completed", icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: typeof AlertTriangle | null }> = {
  high: { label: "High", color: "text-red-500", icon: AlertTriangle },
  normal: { label: "Normal", color: "text-gray-400", icon: null },
  low: { label: "Low", color: "text-blue-400", icon: ArrowDown },
};

function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isSoon: boolean } {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isSoon: false };
  if (diffDays === 0) return { text: "Due today", isOverdue: false, isSoon: true };
  if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false, isSoon: true };
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, isOverdue: false, isSoon: true };
  return { text: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }), isOverdue: false, isSoon: false };
}

export interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusToggle?: (task: Task, newStatus: TaskStatus) => void;
  linkTo?: string;
  compact?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onStatusToggle, linkTo, compact }: TaskCardProps) {
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const isCompleted = task.status === "completed";
  const hasActions = onEdit || onDelete;
  const priorityConfig = PRIORITY_CONFIG[task.priority ?? "normal"];
  const PriorityIcon = priorityConfig.icon;
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  const statusIcon = (
    <StatusIcon
      className={cn(
        "transition-all duration-150",
        compact ? "h-4 w-4" : "h-5 w-5",
        task.status === "completed" ? "text-green-500" :
        task.status === "in_progress" ? "text-blue-500 animate-spin" :
        "text-gray-400",
        onStatusToggle && "hover:text-green-500"
      )}
    />
  );

  const content = (
    <>
      <div className={cn("flex items-start gap-3 flex-1 min-w-0", !compact && "gap-4 pr-4")}>
        <div className={cn("shrink-0", compact ? "mt-0.5" : "mt-1")}>
          {onStatusToggle ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusToggle(task, isCompleted ? "pending" : "completed");
              }}
              className="rounded-full transition-all duration-150 hover:bg-gray-100 active:scale-90 p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-purple"
              title={`Mark as ${isCompleted ? "pending" : "completed"}`}
            >
              {statusIcon}
            </button>
          ) : (
            statusIcon
          )}
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {PriorityIcon && (
              <PriorityIcon className={cn("h-3.5 w-3.5 shrink-0", priorityConfig.color)} />
            )}
            <span
              className={cn(
                "font-medium text-gray-900 truncate",
                compact ? "text-sm" : "text-base",
                isCompleted && "line-through text-gray-500"
              )}
            >
              {task.title}
            </span>
            <Badge
              variant={task.status}
              className={cn(
                "text-[10px] uppercase tracking-wider h-5 flex-shrink-0",
                compact ? "inline-flex" : "hidden md:inline-flex"
              )}
            >
              {config.label}
            </Badge>
          </div>

          {task.description && (
            <span
              className={cn(
                "line-clamp-2",
                compact ? "text-xs text-gray-500" : "text-sm max-w-2xl",
                !compact && (isCompleted ? "text-gray-400" : "text-gray-500")
              )}
            >
              {task.description}
            </span>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {dueInfo && !isCompleted && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                dueInfo.isOverdue ? "text-red-500 font-medium" :
                dueInfo.isSoon ? "text-amber-600" : "text-gray-400"
              )}>
                <Calendar className="h-3 w-3" />
                {dueInfo.text}
              </span>
            )}
            <span className={cn("text-gray-400", compact ? "text-[11px]" : "text-xs")}>
              {timeAgo(task.updatedAt || task.createdAt)}
            </span>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-0.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Mobile badge (page only) */}
          {!compact && (
            <div className="md:hidden mt-2">
              <Badge variant={task.status} className="text-[10px] uppercase tracking-wider h-5 inline-flex">
                {config.label}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {hasActions && (
        <div className={cn(
          "flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
          compact ? "gap-1" : "gap-2"
        )}>
          {!compact && <span className="w-px h-8 bg-gray-100 hidden md:block mr-2" />}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit task"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(task); }}
              className={cn(
                "text-gray-400 hover:text-gray-900 hover:bg-surface rounded-full transition-all duration-150",
                compact ? "h-8 w-8" : "h-10 w-10"
              )}
            >
              <Pencil className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete task"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task); }}
              className={cn(
                "text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-150",
                compact ? "h-8 w-8" : "h-10 w-10"
              )}
            >
              <Trash2 className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </Button>
          )}
        </div>
      )}

      {/* Link icon (when no actions) */}
      {linkTo && !hasActions && (
        <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/card:text-gray-400 shrink-0 mt-0.5 transition-all duration-150" />
      )}
    </>
  );

  const className = cn(
    "group group/card relative flex items-center transition-all duration-200 border",
    compact
      ? "gap-3 p-3.5 rounded-2xl bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-md"
      : cn(
          "justify-between p-4 md:p-5 rounded-2xl border-transparent",
          "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-gray-100",
          isCompleted && "opacity-75"
        )
  );

  if (linkTo) {
    return <Link to={linkTo} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
