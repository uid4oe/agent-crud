import { Loader2 } from "lucide-react";
import { PRIMARY_SUGGESTIONS, QUICK_ACTIONS } from "./welcome-screen.data";

interface WelcomeScreenProps {
	onNewChat: (initialMessage?: string) => void;
	isCreating: boolean;
}

export function WelcomeScreen({ onNewChat, isCreating }: WelcomeScreenProps) {
	return (
		<div className="h-full flex flex-col items-center justify-center p-6 md:p-8">
			{/* Hero */}
			<div className="w-full max-w-4xl flex flex-col items-center mb-10">
				<h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-400 text-transparent bg-clip-text leading-tight tracking-tight">
					Hello,
				</h1>
				<h1 className="text-3xl md:text-4xl font-medium text-ink-faded leading-tight tracking-tight mt-1">
					How can I help you today?
				</h1>
				<p className="text-[13px] text-ink-faded mt-3 text-center">
					AI agents for tasks, notes, and goals — ask anything or try a suggestion below
				</p>
			</div>

			{/* Primary suggestion cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl w-full">
				{PRIMARY_SUGGESTIONS.map(({ icon: Icon, title, description, prompt }, i) => (
					<button
						key={title}
						onClick={() => onNewChat(prompt)}
						disabled={isCreating}
						className="flex flex-col items-start p-5 bg-surface rounded-2xl text-left transition-all duration-200 cursor-pointer w-full h-40 border border-transparent hover:border-purple/60 hover:shadow-soft hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group animate-message-in"
						style={{
							animationDelay: `${i * 75}ms`,
							animationFillMode: "backwards",
						}}
					>
						<div className="flex flex-col flex-1 w-full justify-between h-full">
							<div>
								<div className="text-[15px] text-ink font-medium mb-0.5">
									{title}
								</div>
								{description && (
									<div className="text-[12px] text-ink-faded">
										{description}
									</div>
								)}
							</div>
							<div className="w-8 h-8 self-end rounded-full bg-white group-hover:bg-purple-light transition-all duration-200 flex items-center justify-center shadow-sm">
								<Icon className="h-4 w-4 text-ink-secondary group-hover:text-purple-text transition-colors duration-150" />
							</div>
						</div>
					</button>
				))}
			</div>

			{/* Quick actions */}
			<div
				className="flex flex-col items-center gap-3 mt-8 max-w-4xl w-full animate-message-in"
				style={{ animationDelay: "350ms", animationFillMode: "backwards" }}
			>
				<span className="text-[11px] text-ink-faded font-medium uppercase tracking-widest">
					Quick actions
				</span>
				<div className="flex flex-wrap justify-center gap-2">
					{QUICK_ACTIONS.map(({ icon: Icon, label, prompt, color }) => (
						<button
							key={label}
							onClick={() => onNewChat(prompt)}
							disabled={isCreating}
							className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-purple-light rounded-full text-[13px] text-ink-secondary hover:text-purple-text border border-surface-hover hover:border-purple/40 transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
						>
							<Icon className={`h-3.5 w-3.5 ${color}`} />
							{label}
						</button>
					))}
				</div>
			</div>

			{isCreating && (
				<div className="mt-6 flex items-center gap-2 text-sm text-ink-secondary animate-message-in">
					<Loader2 className="w-4 h-4 animate-spin text-purple-text" />
					Starting conversation...
				</div>
			)}
		</div>
	);
}
