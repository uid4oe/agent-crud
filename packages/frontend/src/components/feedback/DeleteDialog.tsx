import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  resourceType: string;
  resourceName?: string;
}

export function DeleteDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  resourceType,
  resourceName,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            Delete {resourceType}
          </DialogTitle>
        </DialogHeader>
        <p className="text-[15px] leading-relaxed text-gray-600 mb-2">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">
            "{resourceName}"
          </span>
          ? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
