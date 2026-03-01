import { ArrowUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface ChatInputProps {
	onSend: (message: string) => void;
	disabled: boolean;
	autoFocus?: boolean;
}

export function ChatInput({ onSend, disabled, autoFocus }: ChatInputProps) {
	const [input, setInput] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (autoFocus && !disabled) {
			inputRef.current?.focus();
		}
	}, [autoFocus, disabled]);

	const resizeTextarea = () => {
		const textarea = inputRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
		resizeTextarea();
	};

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!input.trim() || disabled) return;
			onSend(input.trim());
			setInput("");
		},
		[input, disabled, onSend],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className="w-full">
			<div
				className={cn(
					"relative rounded-3xl bg-surface transition-all duration-300",
					isFocused ? "bg-white shadow-md ring-2 ring-purple" : "hover:bg-surface-hover"
				)}
			>
				<form
					onSubmit={handleSubmit}
					className="flex px-4 py-2 min-h-[48px] items-end relative"
				>
					<textarea
						ref={inputRef}
						value={input}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						placeholder="Ask me anything..."
						disabled={disabled}
						rows={1}
						className="flex-1 resize-none bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:opacity-50 py-1.5 px-2 text-[15px] leading-relaxed self-center max-h-[200px] overflow-y-auto w-full"
						style={{ minHeight: "24px" }}
					/>

					<button
						type="submit"
						aria-label="Send message"
						disabled={!input.trim() || disabled}
						className={cn(
							"flex items-center justify-center p-2 rounded-full flex-shrink-0 ml-2 mb-[2px] transition-all duration-200",
							input.trim() && !disabled
								? "bg-black text-white hover:bg-gray-800 scale-100"
								: "bg-transparent text-gray-400 cursor-not-allowed scale-95"
						)}
					>
						{disabled ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<ArrowUp className="h-5 w-5" strokeWidth={2} />
						)}
					</button>
				</form>
			</div>
			<p className="text-[11px] text-gray-400 text-center mt-2 hidden sm:block">
				<kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">
					Enter
				</kbd>{" "}
				to send
				<span className="mx-1.5 text-gray-300">&middot;</span>
				<kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">
					Shift + Enter
				</kbd>{" "}
				for new line
			</p>
		</div>
	);
}
