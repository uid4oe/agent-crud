import { Pencil, Trash2, ExternalLink, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn, timeAgo } from "../../lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDueDate } from "./task-card.data";
import type { Task, TaskStatus } from "../../types";

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

  const statusToggle = (
    <div className="shrink-0">
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
  );

  const actionButtons = hasActions ? (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit task"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(task); }}
          className="text-gray-400 hover:text-gray-900 hover:bg-surface rounded-full h-8 w-8 transition-all duration-150"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete task"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task); }}
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 transition-all duration-150"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  ) : linkTo ? (
    <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/card:text-gray-400 shrink-0 transition-all duration-150" />
  ) : null;

  const content = compact ? (
    // Compact mode (list view) — unchanged horizontal layout
    <>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="shrink-0 mt-0.5">{statusToggle}</div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {PriorityIcon && (
              <PriorityIcon className={cn("h-3.5 w-3.5 shrink-0", priorityConfig.color)} />
            )}
            <span className={cn("font-medium text-gray-900 truncate text-sm", isCompleted && "line-through text-gray-500")}>
              {task.title}
            </span>
            <Badge variant={task.status} className="text-[10px] uppercase tracking-wider h-5 flex-shrink-0 inline-flex">
              {config.label}
            </Badge>
          </div>
          {task.description && (
            <span className="text-xs text-gray-500 line-clamp-2">{task.description}</span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {dueInfo && !isCompleted && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                dueInfo.isOverdue ? "text-red-500 font-medium" : dueInfo.isSoon ? "text-amber-600" : "text-gray-400"
              )}>
                <Calendar className="h-3 w-3" />{dueInfo.text}
              </span>
            )}
            <span className="text-[11px] text-gray-400">{timeAgo(task.updatedAt || task.createdAt)}</span>
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-0.5">
              {task.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {actionButtons}
    </>
  ) : (
    // Kanban mode — vertical card layout
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {statusToggle}
          {PriorityIcon && <PriorityIcon className={cn("h-3.5 w-3.5 shrink-0", priorityConfig.color)} />}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={task.status} className="text-[10px] uppercase tracking-wider h-5 flex-shrink-0">
            {config.label}
          </Badge>
          {actionButtons}
        </div>
      </div>

      <h3 className={cn(
        "font-semibold text-ink leading-snug text-[15px] mb-1",
        isCompleted && "line-through text-gray-500"
      )}>
        {task.title}
      </h3>

      {task.description && (
        <p className={cn(
          "text-[13px] leading-relaxed line-clamp-2 mb-3",
          isCompleted ? "text-gray-400" : "text-ink-secondary"
        )}>
          {task.description}
        </p>
      )}

      <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-gray-50">
        <div className="flex flex-col gap-0.5">
          {dueInfo && !isCompleted && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              dueInfo.isOverdue ? "text-red-500 font-medium" : dueInfo.isSoon ? "text-amber-600" : "text-gray-400"
            )}>
              <Calendar className="h-3 w-3" />{dueInfo.text}
            </span>
          )}
          <span className="text-[11px] text-gray-400">{timeAgo(task.updatedAt || task.createdAt)}</span>
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="font-medium bg-surface text-gray-600 rounded-full text-[11px] px-2 py-0.5">{tag}</span>
            ))}
            {task.tags.length > 3 && (
              <span className="font-medium text-gray-400 text-[11px] px-1 py-0.5">+{task.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const className = cn(
    "group group/card relative transition-all duration-200 border",
    compact
      ? "flex items-center gap-3 p-3.5 rounded-2xl bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-md"
      : cn(
          "flex flex-col p-5 rounded-2xl",
          "bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
          isCompleted && "opacity-75"
        )
  );

  if (linkTo) {
    return <Link to={linkTo} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
