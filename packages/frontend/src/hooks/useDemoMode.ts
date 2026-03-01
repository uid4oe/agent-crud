import { useState, useCallback, useRef, useEffect } from "react";
import { DEMO_STEPS } from "../config/demo-prompts";

interface UseDemoModeOptions {
	sendMessage: (message: string) => void;
	startNewConversation: (initialMessage?: string) => void;
	isSending: boolean;
	activeConversationId: string | null;
}

export function useDemoMode({
	sendMessage,
	startNewConversation,
	isSending,
	activeConversationId,
}: UseDemoModeOptions) {
	const [isActive, setIsActive] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const waitingForResponse = useRef(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const totalSteps = DEMO_STEPS.length;
	const currentPrompt = isActive ? DEMO_STEPS[currentStep] : null;

	const cleanup = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		waitingForResponse.current = false;
	}, []);

	const stop = useCallback(() => {
		cleanup();
		setIsActive(false);
		setCurrentStep(0);
		setIsPaused(false);
	}, [cleanup]);

	const start = useCallback(() => {
		cleanup();
		setIsActive(true);
		setCurrentStep(0);
		setIsPaused(false);

		// Kick off step 0: create a new conversation with first prompt
		const firstStep = DEMO_STEPS[0];
		if (firstStep) {
			waitingForResponse.current = true;
			startNewConversation(firstStep.prompt);
		}
	}, [cleanup, startNewConversation]);

	const pause = useCallback(() => {
		setIsPaused(true);
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const resume = useCallback(() => {
		setIsPaused(false);
	}, []);

	const skipToNext = useCallback(() => {
		cleanup();
		const nextStep = currentStep + 1;
		if (nextStep >= totalSteps) {
			stop();
			return;
		}
		setCurrentStep(nextStep);
		setIsPaused(false);

		// Send next prompt immediately
		const step = DEMO_STEPS[nextStep];
		if (step && activeConversationId) {
			waitingForResponse.current = true;
			sendMessage(step.prompt);
		}
	}, [currentStep, totalSteps, stop, cleanup, activeConversationId, sendMessage]);

	// Watch for response completion and advance to next step
	useEffect(() => {
		if (!isActive || isPaused || !waitingForResponse.current) return;

		// Response just finished
		if (!isSending && waitingForResponse.current) {
			waitingForResponse.current = false;

			const step = DEMO_STEPS[currentStep];
			const nextStep = currentStep + 1;

			if (nextStep >= totalSteps) {
				// Demo complete — wait a beat then stop
				timerRef.current = setTimeout(() => stop(), 2000);
				return;
			}

			// Schedule next prompt after delay
			timerRef.current = setTimeout(() => {
				if (!activeConversationId) return;
				setCurrentStep(nextStep);
				const nextPromptData = DEMO_STEPS[nextStep];
				if (nextPromptData) {
					waitingForResponse.current = true;
					sendMessage(nextPromptData.prompt);
				}
			}, step?.delayAfterResponse ?? 3000);
		}
	}, [isActive, isPaused, isSending, currentStep, totalSteps, activeConversationId, sendMessage, stop]);

	// Cleanup on unmount
	useEffect(() => cleanup, [cleanup]);

	return {
		isActive,
		isPaused,
		currentStep,
		totalSteps,
		currentPrompt,
		start,
		stop,
		pause,
		resume,
		skipToNext,
	};
}
