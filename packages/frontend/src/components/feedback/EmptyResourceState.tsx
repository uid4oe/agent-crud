import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyResourceStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  createLabel: string;
  onCreateClick: () => void;
}

export function EmptyResourceState({
  icon: Icon,
  title,
  description,
  createLabel,
  onCreateClick,
}: EmptyResourceStateProps) {
  return (
    <div className="bg-surface rounded-[2rem] p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-[15px] text-gray-500 mb-8 max-w-sm leading-relaxed">
        {description}
      </p>
      <Button
        onClick={onCreateClick}
        className="rounded-full px-6 h-11 bg-black hover:bg-gray-800 text-white shadow-sm transition-all"
      >
        <Plus className="h-4 w-4 mr-2" />
        {createLabel}
      </Button>
    </div>
  );
}
