import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { noteFormSchema, type NoteFormSchema } from "../../lib/validation";
import { NOTE_CATEGORY_OPTIONS, NOTE_CATEGORIES } from "../../config";

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NoteFormSchema) => void;
  initialData?: Partial<NoteFormSchema>;
  title: string;
  isLoading?: boolean;
}

const DEFAULT_VALUES: NoteFormSchema = {
  title: "",
  content: "",
  category: NOTE_CATEGORIES.GENERAL,
  tags: "",
};

export function NoteForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  isLoading,
}: NoteFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormSchema>({
    resolver: zodResolver(noteFormSchema),
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
              placeholder="Note title..."
              className={errors.title ? "border-red-300 focus:ring-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              {...register("content")}
              id="content"
              placeholder="Write your note..."
              rows={8}
              className="resize-none"
            />
            {errors.content && (
              <p className="text-xs text-red-500">{errors.content.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select {...register("category")} id="category">
                {NOTE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags <span className="text-gray-400 font-normal">(comma separated)</span>
              </label>
              <Input
                {...register("tags")}
                id="tags"
                placeholder="work, important, todo..."
              />
              {errors.tags && (
                <p className="text-xs text-red-500">{errors.tags.message}</p>
              )}
            </div>
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
              {isLoading ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
