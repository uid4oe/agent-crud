import type { Event } from "@google/adk";
import type { EntityCard } from "./types.js";

/** Known sub-agent names for routing info extraction. */
const KNOWN_AGENTS = new Set(["TaskAgent", "NoteAgent", "GoalAgent"]);

/**
 * Extract routing info (which sub-agent handled the request) from events.
 * Returns the first sub-agent name found, or null.
 */
export function extractRoutingAgent(event: Event): string | null {
  const author = event.author;
  if (author && KNOWN_AGENTS.has(author)) return author;
  return null;
}

/** Format routing info as a tag the frontend can parse. */
export function formatRoutingInfo(agentName: string): string {
  return `<routing-info>${agentName}</routing-info>`;
}

/** Tools whose results should be rendered as entity cards in the UI. */
const TASK_CARD_TOOLS = new Set([
  "create_task", "update_task", "get_task_by_id", "list_tasks", "search_tasks",
  "create_other_task",
]);
const NOTE_CARD_TOOLS = new Set([
  "create_note", "update_note", "get_note_by_id", "list_notes", "search_notes",
  "create_other_note",
]);
const GOAL_CARD_TOOLS = new Set([
  "create_goal", "update_goal", "get_goal_by_id", "list_goals", "search_goals", "toggle_milestone",
  "create_other_goal",
]);

export function formatCards(cards: EntityCard[]): string {
  return cards
    .map((c) => `<${c.type}-card>${JSON.stringify(c.data)}</${c.type}-card>`)
    .join("\n");
}

/**
 * Scan an ADK event for function responses from entity-mutating tools and
 * collect structured card data for the frontend to render inline.
 */
export function collectCards(event: Event, cards: EntityCard[]): void {
  if (!event.content?.parts) return;

  for (const part of event.content.parts) {
    const fr = part.functionResponse;
    if (!fr?.name) continue;

    const isTask = TASK_CARD_TOOLS.has(fr.name);
    const isNote = NOTE_CARD_TOOLS.has(fr.name);
    const isGoal = GOAL_CARD_TOOLS.has(fr.name);
    if (!isTask && !isNote && !isGoal) continue;

    // The tool result can be nested in various shapes depending on ADK version
    const response = fr.response;
    let raw: string | undefined;
    if (typeof response === "string") raw = response;
    else if (typeof response?.output === "string") raw = response.output;
    else if (typeof response?.result === "string") raw = response.result;
    if (!raw) continue;

    // Skip error / "not found" messages
    if (raw.startsWith("Error") || raw.startsWith("No ") || raw.includes("not found")) continue;

    try {
      const parsed = JSON.parse(raw);
      const type = isTask ? "task" : isNote ? "note" : "goal";
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.id) cards.push({ type, data: item });
        }
      } else if (parsed?.id) {
        cards.push({ type, data: parsed });
      }
    } catch {
      // Not valid JSON — skip
    }
  }
}
