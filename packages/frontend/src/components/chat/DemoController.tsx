import { Monitor, Pause, Play, SkipForward, Square } from "lucide-react";
import { cn } from "../../lib/utils";

interface DemoControllerProps {
	isActive: boolean;
	isPaused: boolean;
	currentStep: number;
	totalSteps: number;
	currentPrompt: { label: string } | null;
	onStart: () => void;
	onStop: () => void;
	onPause: () => void;
	onResume: () => void;
	onSkip: () => void;
}

export function DemoController({
	isActive,
	isPaused,
	currentStep,
	totalSteps,
	currentPrompt,
	onStart,
	onStop,
	onPause,
	onResume,
	onSkip,
}: DemoControllerProps) {
	if (!isActive) {
		return (
			<button
				type="button"
				onClick={onStart}
				className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-sm font-medium"
			>
				<Monitor className="h-4 w-4" />
				Demo Mode
			</button>
		);
	}

	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
			{/* Progress & label */}
			<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 px-4 py-3 min-w-[280px]">
				{/* Progress bar */}
				<div className="flex items-center gap-3 mb-2">
					<span className="text-xs font-mono text-gray-500 shrink-0">
						{currentStep + 1}/{totalSteps}
					</span>
					<div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
							style={{
								width: `${((currentStep + 1) / totalSteps) * 100}%`,
							}}
						/>
					</div>
				</div>

				{/* Current step label */}
				{currentPrompt && (
					<p className="text-sm text-gray-700 font-medium truncate">
						{currentPrompt.label}
					</p>
				)}

				{/* Controls */}
				<div className="flex items-center gap-1 mt-2.5">
					<button
						type="button"
						onClick={isPaused ? onResume : onPause}
						className={cn(
							"p-1.5 rounded-lg transition-colors",
							"hover:bg-gray-100 text-gray-600"
						)}
						title={isPaused ? "Resume" : "Pause"}
					>
						{isPaused ? (
							<Play className="h-4 w-4" />
						) : (
							<Pause className="h-4 w-4" />
						)}
					</button>

					<button
						type="button"
						onClick={onSkip}
						className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
						title="Skip to next"
					>
						<SkipForward className="h-4 w-4" />
					</button>

					<button
						type="button"
						onClick={onStop}
						className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors ml-auto"
						title="Stop demo"
					>
						<Square className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
