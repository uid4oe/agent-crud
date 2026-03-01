import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { TASK_PRIORITIES, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TASK_STATUSES } from "../../config";
import { type TaskFormSchema, taskFormSchema } from "../../lib/validation";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormSchema) => void;
  initialData?: Partial<TaskFormSchema>;
  title: string;
  isLoading?: boolean;
}

const DEFAULT_VALUES: TaskFormSchema = {
  title: "",
  description: "",
  status: TASK_STATUSES.PENDING,
  priority: TASK_PRIORITIES.NORMAL,
  dueDate: "",
  tags: "",
};

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  isLoading,
}: TaskFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormSchema>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
  });

  useEffect(() => {
    if (open) {
      reset({ ...DEFAULT_VALUES, ...initialData });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, initialData, reset]);

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data);
  });

  const { ref: registerRef, ...titleRegister } = register("title");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onFormSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...titleRegister}
              ref={(e) => {
                registerRef(e);
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
              }}
              id="title"
              placeholder="What needs to be done?"
              className={errors.title ? "border-red-300 focus:ring-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Textarea
              {...register("description")}
              id="description"
              placeholder="Add more details..."
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select {...register("status")} id="status">
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select {...register("priority")} id="priority">
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              {...register("dueDate")}
              id="dueDate"
              type="date"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <Input
              {...register("tags")}
              id="tags"
              placeholder="e.g. urgent, work, personal"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Saving..." : "Save Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
