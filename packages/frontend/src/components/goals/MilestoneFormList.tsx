import { Plus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface MilestoneFormListProps {
  milestones: { id?: string; title: string; completed?: boolean }[];
  onChange: (milestones: { id?: string; title: string; completed?: boolean }[]) => void;
  errors?: { title?: { message?: string } }[];
}

export function MilestoneFormList({ milestones, onChange, errors }: MilestoneFormListProps) {
  const addMilestone = () => {
    onChange([...milestones, { title: "", completed: false }]);
  };

  const removeMilestone = (index: number) => {
    onChange(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, title: string) => {
    onChange(milestones.map((m, i) => (i === index ? { ...m, title } : m)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Milestones</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addMilestone}
          className="text-xs h-7 px-2"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      {milestones.length === 0 && (
        <p className="text-xs text-gray-400">No milestones yet. Add steps to track your progress.</p>
      )}
      <div className="space-y-2">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
            <Input
              value={m.title}
              onChange={(e) => updateMilestone(i, e.target.value)}
              placeholder={`Milestone ${i + 1}...`}
              className="flex-1 h-9 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove milestone"
              onClick={() => removeMilestone(i)}
              className="h-7 w-7 text-gray-400 hover:text-red-500 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            {errors?.[i]?.title?.message && (
              <p className="text-xs text-red-500">{errors[i].title?.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
