import type { LucideIcon } from "lucide-react";
import {
	AlertCircle,
	BarChart3,
	BookOpen,
	CalendarDays,
	CheckCircle2,
	Dumbbell,
	Flame,
	Layers,
	Lightbulb,
	ListChecks,
	NotebookPen,
	PenLine,
	Search,
	Target,
	TrendingUp,
} from "lucide-react";

export interface Suggestion {
	icon: LucideIcon;
	title: string;
	prompt: string;
	description?: string;
}

export interface QuickAction {
	icon: LucideIcon;
	label: string;
	prompt: string;
	color: string;
}

export const PRIMARY_SUGGESTIONS: Suggestion[] = [
	{
		icon: CalendarDays,
		title: "Plan my week",
		description: "Cross-domain summary",
		prompt:
			"Summarize what I need to do this week across tasks, notes, and goals. Include overdue items, upcoming deadlines, and goal progress.",
	},
	{
		icon: ListChecks,
		title: "Create a task",
		description: "With priority & due date",
		prompt:
			"Create a high-priority task called 'Prepare Q1 demo presentation' due in 3 days with tags 'work' and 'presentation'",
	},
	{
		icon: Lightbulb,
		title: "Capture an idea",
		description: "Save a new note",
		prompt:
			"Save an idea note titled 'AI-powered daily standup bot' about building a Slack bot that collects async standups and generates summaries using LLMs",
	},
	{
		icon: Target,
		title: "Track a goal",
		description: "With milestones",
		prompt:
			"Create a fitness goal to 'Complete a half marathon' with milestones: run 5K, run 10K, run 15K, complete 21K race",
	},
];

export const QUICK_ACTIONS: QuickAction[] = [
	{ icon: AlertCircle, label: "What's overdue?", prompt: "Show all overdue tasks and suggest how to reschedule them", color: "text-red-500" },
	{ icon: Flame, label: "High priority", prompt: "List all high-priority tasks that are still pending or in progress", color: "text-amber-500" },
	{ icon: CheckCircle2, label: "Mark complete", prompt: "Show my in-progress tasks so I can mark some as completed", color: "text-green-500" },
	{ icon: Search, label: "Search everything", prompt: "Find everything related to 'engineering' across tasks, notes, and goals", color: "text-blue-500" },
	{ icon: NotebookPen, label: "Meeting notes", prompt: "Create a meeting note for today's sprint planning with attendees, decisions, and action items", color: "text-purple-500" },
	{ icon: BookOpen, label: "Reference note", prompt: "Create a reference note titled 'Docker cheat sheet' with common Docker commands for containers, images, and volumes", color: "text-purple-500" },
	{ icon: TrendingUp, label: "Goal progress", prompt: "Show progress on all my active goals and list which milestones are still pending", color: "text-emerald-500" },
	{ icon: Dumbbell, label: "Fitness goal", prompt: "Create a fitness goal to 'Do 50 pushups' with milestones for 10, 20, 30, 40, and 50 pushups", color: "text-emerald-500" },
	{ icon: Layers, label: "Multi-domain", prompt: "Show my overdue tasks, recent notes, and active goals all together in one summary", color: "text-blue-500" },
	{ icon: PenLine, label: "Update a task", prompt: "Change the priority of 'Update project README' to high and move the due date to tomorrow", color: "text-amber-500" },
	{ icon: BarChart3, label: "Weekly review", prompt: "Give me a weekly review: what I completed, what's still pending, and how my goals are tracking", color: "text-blue-500" },
];
