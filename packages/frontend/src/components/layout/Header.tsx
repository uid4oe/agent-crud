import { ListTodo, Bot } from "lucide-react";
import { cn } from "../../lib/utils";

type Tab = "chat" | "tasks";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "tasks", label: "Tasks", icon: ListTodo },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <h1 className="text-lg font-semibold">TaskAI</h1>
          <nav className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
