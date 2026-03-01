import { FileText, ListTodo, Target, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { type PanelDomain, useEntityPanel } from "./EntityPanelContext";
import { PanelGoalsView } from "./PanelGoalsView";
import { PanelNotesView } from "./PanelNotesView";
import { PanelTasksView } from "./PanelTasksView";

const TABS: { domain: PanelDomain; label: string; icon: typeof ListTodo }[] = [
  { domain: "tasks", label: "Tasks", icon: ListTodo },
  { domain: "notes", label: "Notes", icon: FileText },
  { domain: "goals", label: "Goals", icon: Target },
];

export function EntityPanel() {
  const { isOpen, activeDomain, closePanel, setDomain } = useEntityPanel();

  const open = isOpen && !!activeDomain;

  return (
    <div
      className={cn(
        "h-full bg-white border-l border-gray-100 flex flex-col rounded-r-[1.5rem] mr-2 overflow-hidden transition-all duration-300 ease-out",
        open
          ? "w-[65%] min-w-[480px] opacity-100"
          : "w-0 min-w-0 opacity-0 pointer-events-none"
      )}
    >
      {/* Header */}
      {activeDomain && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.domain}
                  onClick={() => setDomain(tab.domain)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                    activeDomain === tab.domain
                      ? "bg-white text-ink shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={closePanel}
            aria-label="Close panel"
            className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-all duration-150 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Body — key forces remount on tab switch so card-in animations replay */}
      {activeDomain && (
        <div key={activeDomain} className="flex-1 overflow-hidden animate-panel-fade">
          {activeDomain === "tasks" && <PanelTasksView />}
          {activeDomain === "notes" && <PanelNotesView />}
          {activeDomain === "goals" && <PanelGoalsView />}
        </div>
      )}
    </div>
  );
}
