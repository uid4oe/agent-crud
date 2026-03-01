import * as React from "react";
import { cn } from "../../lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-12 w-full rounded-2xl border-none bg-surface px-4 py-2 text-[15px] transition-all cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-purple focus:bg-white focus:shadow-sm text-gray-900",
        "disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
        className
      )}
      ref={ref}
      {...props}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: `right 1rem center`,
        backgroundRepeat: `no-repeat`,
        backgroundSize: `1.5em 1.5em`,
        paddingRight: `2.5rem`,
      }}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export { Select };
