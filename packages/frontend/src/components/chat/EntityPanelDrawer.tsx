import { FileText, ListTodo, Target, X } from "lucide-react";

import { cn } from "../../lib/utils";
import { type PanelDomain, useEntityPanel } from "./EntityPanelContext";
import { PanelGoalsView } from "./PanelGoalsView";
import { PanelNotesView } from "./PanelNotesView";
import { PanelTasksView } from "./PanelTasksView";

const TABS: { domain: PanelDomain; label: string; icon: typeof ListTodo }[] = [
	{ domain: "tasks", label: "Tasks", icon: ListTodo },
	{ domain: "notes", label: "Notes", icon: FileText },
	{ domain: "goals", label: "Wellness", icon: Target },
];

export function EntityPanelDrawer() {
	const { isOpen, activeDomain, closePanel, setDomain } = useEntityPanel();

	if (!activeDomain) return null;

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				className={cn(
					"fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300",
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={closePanel}
				aria-label="Close panel"
			/>

			{/* Drawer */}
			<div
				className={cn(
					"fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out",
					isOpen ? "translate-y-0" : "translate-y-full",
				)}
			>
				<div className="bg-white rounded-t-2xl shadow-lg max-h-[85vh] flex flex-col">
					{/* Handle */}
					<div className="flex justify-center pt-2 pb-1 shrink-0">
						<div className="w-10 h-1 bg-gray-300 rounded-full" />
					</div>

					{/* Header */}
					<div className="flex items-center justify-between px-4 pb-2 shrink-0">
						<div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
							{TABS.map((tab) => {
								const Icon = tab.icon;
								return (
									<button
										type="button"
										key={tab.domain}
										onClick={() => setDomain(tab.domain)}
										className={cn(
											"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
											activeDomain === tab.domain
												? "bg-white text-ink shadow-sm"
												: "text-gray-500 hover:text-gray-700",
										)}
									>
										<Icon className="h-3.5 w-3.5" />
										<span>{tab.label}</span>
									</button>
								);
							})}
						</div>
						<button
							type="button"
							onClick={closePanel}
							aria-label="Close panel"
							className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-all duration-150 active:scale-90"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* Body */}
					<div className="flex-1 overflow-hidden min-h-[50vh]">
						{activeDomain === "tasks" && <PanelTasksView />}
						{activeDomain === "notes" && <PanelNotesView />}
						{activeDomain === "goals" && <PanelGoalsView />}
					</div>
				</div>
			</div>
		</>
	);
}
