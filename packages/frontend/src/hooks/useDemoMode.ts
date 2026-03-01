import { useCallback, useEffect, useRef, useState } from "react";
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
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Track whether the AI has started responding (isSending went true at least once)
	const hasStartedRef = useRef(false);
	const waitingForResponse = useRef(false);

	const totalSteps = DEMO_STEPS.length;
	const currentPrompt = isActive ? DEMO_STEPS[currentStep] : null;

	const cleanup = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		waitingForResponse.current = false;
		hasStartedRef.current = false;
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

		const firstStep = DEMO_STEPS[0];
		if (firstStep) {
			waitingForResponse.current = true;
			hasStartedRef.current = false;
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

	const sendNextStep = useCallback((stepIndex: number) => {
		const step = DEMO_STEPS[stepIndex];
		if (step && activeConversationId) {
			waitingForResponse.current = true;
			hasStartedRef.current = false;
			sendMessage(step.prompt);
		}
	}, [activeConversationId, sendMessage]);

	const skipToNext = useCallback(() => {
		cleanup();
		const nextStep = currentStep + 1;
		if (nextStep >= totalSteps) {
			stop();
			return;
		}
		setCurrentStep(nextStep);
		setIsPaused(false);
		sendNextStep(nextStep);
	}, [currentStep, stop, cleanup, sendNextStep]);

	// Track isSending transitions: must go true→false to count as "response complete"
	useEffect(() => {
		if (!isActive || !waitingForResponse.current) return;

		if (isSending) {
			hasStartedRef.current = true;
			return;
		}

		// isSending is false — only act if it was previously true
		if (!hasStartedRef.current) return;

		// Response complete
		waitingForResponse.current = false;
		hasStartedRef.current = false;

		if (isPaused) return;

		const step = DEMO_STEPS[currentStep];
		const nextStep = currentStep + 1;

		if (nextStep >= totalSteps) {
			timerRef.current = setTimeout(() => stop(), 2000);
			return;
		}

		timerRef.current = setTimeout(() => {
			setCurrentStep(nextStep);
			sendNextStep(nextStep);
		}, step?.delayAfterResponse ?? 3000);
	}, [isActive, isPaused, isSending, currentStep, sendNextStep, stop]);

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
