import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface ResourcePageHeaderProps {
  title: string;
  noun: string;
  totalCount: number;
  filteredCount: number;
  hasActiveFilter: boolean;
  createLabel: string;
  onCreate: () => void;
}

export function ResourcePageHeader({
  title,
  noun,
  totalCount,
  filteredCount,
  hasActiveFilter,
  createLabel,
  onCreate,
}: ResourcePageHeaderProps) {
  const plural = totalCount === 1 ? noun : `${noun}s`;
  const subtitle =
    totalCount === 0
      ? `No ${noun}s`
      : hasActiveFilter
        ? `${filteredCount} of ${totalCount} ${plural}`
        : `${totalCount} ${plural}`;

  return (
    <div className="flex items-center justify-between pb-2 px-2">
      <div>
        <h2 className="text-[28px] font-medium text-gray-900 tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-[15px] text-gray-500 mt-1">{subtitle}</p>
      </div>
      <Button
        onClick={onCreate}
        className="rounded-full px-5 h-11 bg-black hover:bg-gray-800 text-white shadow-sm transition-all"
      >
        <Plus className="h-4 w-4 mr-2" />
        {createLabel}
      </Button>
    </div>
  );
}
