import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative z-[100] animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>,
    document.body
  );
};

const dialogSizes = {
  sm: "w-[460px]",
  md: "w-[580px]",
  lg: "w-[720px]",
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof dialogSizes;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("max-w-[calc(100vw-2rem)] bg-white p-8 rounded-[2rem] shadow-2xl overflow-hidden", dialogSizes[size], className)}
      {...props}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2 mb-6", className)} {...props} />
);

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-[26px] leading-tight font-medium tracking-tight text-gray-900", className)} {...props} />
  )
);
DialogTitle.displayName = "DialogTitle";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-end gap-3 mt-8", className)} {...props} />
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter };
