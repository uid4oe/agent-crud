export interface DemoStep {
	label: string;
	prompt: string;
	delayAfterResponse: number;
}

export const DEMO_STEPS: DemoStep[] = [
	// Act 1 — Single Domain CRUD
	{
		label: "Create a task",
		prompt:
			'Create a high priority task called "Book flight to Stockholm" due next Friday with tags "travel" and "planning"',
		delayAfterResponse: 3000,
	},
	{
		label: "Create a note",
		prompt:
			'Save a note titled "Sweden Trip Packing List" with content "Passport, warm layers, waterproof jacket, comfortable walking shoes, camera, portable charger, Swedish krona" in the personal category',
		delayAfterResponse: 3000,
	},
	{
		label: "List tasks",
		prompt: "List all my tasks",
		delayAfterResponse: 2500,
	},

	// Act 2 — Goals & Cross-Domain
	{
		label: "Create a goal",
		prompt:
			'Create a goal called "Learn Swedish Basics" with milestones: learn common greetings, practice ordering fika, hold a simple conversation, navigate Stockholm in Swedish',
		delayAfterResponse: 3000,
	},
	{
		label: "Cross-domain query",
		prompt: "What tasks and notes do I have related to Sweden?",
		delayAfterResponse: 3000,
	},
	{
		label: "Complete milestone",
		prompt: 'Mark the "learn common greetings" milestone as complete',
		delayAfterResponse: 2500,
	},

	// Act 3 — Bulk & Updates
	{
		label: "Batch create",
		prompt:
			'Create 3 tasks: "Research restaurants in Gamla Stan", "Book Northern Lights tour", and "Get travel insurance" — all tagged "sweden"',
		delayAfterResponse: 3000,
	},
	{
		label: "Batch complete",
		prompt: 'Mark "Book Northern Lights tour" and "Get travel insurance" as done',
		delayAfterResponse: 2500,
	},

	// Act 4 — Search & Intelligence
	{
		label: "Search notes",
		prompt: "Search my notes for anything about Sweden",
		delayAfterResponse: 2500,
	},
	{
		label: "Incomplete tasks",
		prompt: "Show me all incomplete tasks",
		delayAfterResponse: 2500,
	},

	// Act 5 — Conversational Intelligence
	{
		label: "Goal progress",
		prompt:
			'What\'s my overall progress on the "Learn Swedish Basics" goal?',
		delayAfterResponse: 3000,
	},
	{
		label: "Update note",
		prompt:
			'Update the "Sweden Trip Packing List" note — add "thermal socks and a beanie" to the content',
		delayAfterResponse: 3000,
	},
];
