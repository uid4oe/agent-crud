import { Search } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyFilterStateProps {
  onClear: () => void;
}

export function EmptyFilterState({ onClear }: EmptyFilterStateProps) {
  return (
    <div className="bg-surface rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
      <Search className="h-8 w-8 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-600">
        No results match your filter
      </p>
      <Button variant="link" size="sm" onClick={onClear} className="mt-1">
        Clear filters
      </Button>
    </div>
  );
}
