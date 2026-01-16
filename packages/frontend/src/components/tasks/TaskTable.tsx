import { Pencil, Trash2, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import type { Task, TaskStatus } from "../../types";

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Clock }> = {
  pending: { label: "Pending", icon: Clock },
  in_progress: { label: "In Progress", icon: Loader2 },
  completed: { label: "Completed", icon: CheckCircle2 },
};

export function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Task</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Description</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((task) => {
            const StatusIcon = STATUS_CONFIG[task.status].icon;
            return (
              <tr key={task.id} className="group hover:bg-muted/30">
                <td className="px-4 py-3">
                  <span className={cn("font-medium", task.status === "completed" && "text-muted-foreground line-through")}>
                    {task.title}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground line-clamp-1">{task.description || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={task.status}>
                    <StatusIcon className={cn("h-3 w-3 mr-1", task.status === "in_progress" && "animate-spin")} />
                    {STATUS_CONFIG[task.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(task)} className="h-8 w-8 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
