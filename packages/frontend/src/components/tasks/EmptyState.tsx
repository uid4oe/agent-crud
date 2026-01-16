import { Button } from "../ui/button";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="border border-dashed rounded-lg p-8 text-center">
      <p className="text-muted-foreground text-sm">No tasks yet</p>
      <Button onClick={onCreateClick} variant="link" size="sm" className="mt-2">
        Create your first task
      </Button>
    </div>
  );
}
