import { cn } from "../../lib/utils";

interface AgentIconProps {
  className?: string;
  pulse?: boolean;
}

export function AgentIcon({ className, pulse }: AgentIconProps) {
  return (
    <div
      className={cn(
        "h-6 w-6 flex items-center justify-center",
        pulse && "animate-pulse",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        {/* Central node */}
        <circle cx="12" cy="10" r="3" stroke="#4B5563" strokeWidth="1.8" fill="none" />
        {/* Bottom-left node */}
        <circle cx="6" cy="19" r="2" stroke="#4B5563" strokeWidth="1.8" fill="none" />
        {/* Bottom-right node */}
        <circle cx="18" cy="19" r="2" stroke="#4B5563" strokeWidth="1.8" fill="none" />
        {/* Top connector */}
        <line x1="12" y1="7" x2="12" y2="3" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" />
        {/* Top dot */}
        <circle cx="12" cy="3" r="1.2" fill="#4B5563" />
        {/* Left branch */}
        <line x1="9.5" y1="12" x2="7" y2="17" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" />
        {/* Right branch */}
        <line x1="14.5" y1="12" x2="17" y2="17" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}
