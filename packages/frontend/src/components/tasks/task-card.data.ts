import { CheckCircle2, Clock, Loader2, AlertTriangle, ArrowDown } from "lucide-react";
import type { TaskStatus, TaskPriority } from "../../types";

export const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Clock }> = {
  pending: { label: "Pending", icon: Clock },
  in_progress: { label: "In Progress", icon: Loader2 },
  completed: { label: "Completed", icon: CheckCircle2 },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: typeof AlertTriangle | null }> = {
  high: { label: "High", color: "text-red-500", icon: AlertTriangle },
  normal: { label: "Normal", color: "text-gray-400", icon: null },
  low: { label: "Low", color: "text-blue-400", icon: ArrowDown },
};

export function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isSoon: boolean } {
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
