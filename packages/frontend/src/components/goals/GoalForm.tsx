import { useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { goalFormSchema, type GoalFormSchema } from "../../lib/validation";
import { GOAL_CATEGORY_OPTIONS, GOAL_STATUS_OPTIONS, GOAL_CATEGORIES, GOAL_STATUSES } from "../../config";
import { MilestoneFormList } from "./MilestoneFormList";

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalFormSchema) => void;
  initialData?: Partial<GoalFormSchema>;
  title: string;
  isLoading?: boolean;
}

const DEFAULT_VALUES: GoalFormSchema = {
  title: "",
  description: "",
  status: GOAL_STATUSES.ACTIVE,
  category: GOAL_CATEGORIES.OTHER,
  targetDate: "",
  milestones: [],
};

export function GoalForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  isLoading,
}: GoalFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<GoalFormSchema>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "milestones",
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
            <label htmlFor="goal-title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...titleRegister}
              ref={(e) => {
                registerRef(e);
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
              }}
              id="goal-title"
              placeholder="Goal title..."
              className={errors.title ? "border-red-300 focus:ring-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="goal-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              {...register("description")}
              id="goal-description"
              placeholder="Describe your goal..."
              rows={3}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="goal-category" className="text-sm font-medium">
                Category
              </label>
              <Select {...register("category")} id="goal-category">
                {GOAL_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="goal-status" className="text-sm font-medium">
                Status
              </label>
              <Select {...register("status")} id="goal-status">
                {GOAL_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="goal-target-date" className="text-sm font-medium">
                Target Date
              </label>
              <Input
                {...register("targetDate")}
                id="goal-target-date"
                type="date"
              />
            </div>
          </div>

          <MilestoneFormList
            milestones={fields}
            onChange={replace}
            errors={errors.milestones as { title?: { message?: string } }[]}
          />

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
              {isLoading ? "Saving..." : "Save Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
