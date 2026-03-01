import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface PageErrorProps {
  resourceName: string;
  message: string;
}

export function PageError({ resourceName, message }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-500 text-xl">!</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">
          Failed to load {resourceName}
        </p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}
