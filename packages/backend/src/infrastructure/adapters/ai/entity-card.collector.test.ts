import { createEvent, type Event } from "@google/adk";
import { describe, expect, it } from "vitest";
import {
  collectCards,
  extractRoutingAgent,
  formatCards,
  formatRoutingInfo,
} from "./entity-card.collector.js";
import type { EntityCard } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFunctionResponseEvent(
  toolName: string,
  response: unknown
): Event {
  return createEvent({
    content: {
      parts: [
        {
          functionResponse: {
            name: toolName,
            response,
          },
        },
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// collectCards
// ---------------------------------------------------------------------------

describe("collectCards", () => {
  it("collects a task card from create_task response", () => {
    const cards: EntityCard[] = [];
    const taskJson = JSON.stringify({ id: "t-1", title: "Buy milk", status: "pending" });
    const event = makeFunctionResponseEvent("create_task", taskJson);

    collectCards(event, cards);

    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe("task");
    expect(cards[0].data).toEqual({ id: "t-1", title: "Buy milk", status: "pending" });
  });

  it("collects a note card from update_note response", () => {
    const cards: EntityCard[] = [];
    const noteJson = JSON.stringify({ id: "n-1", title: "Meeting notes" });
    const event = makeFunctionResponseEvent("update_note", noteJson);

    collectCards(event, cards);

    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe("note");
  });

  it("collects a goal card from get_goal_by_id response", () => {
    const cards: EntityCard[] = [];
    const goalJson = JSON.stringify({ id: "g-1", title: "Get fit" });
    const event = makeFunctionResponseEvent("get_goal_by_id", goalJson);

    collectCards(event, cards);

    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe("goal");
  });

  it("collects multiple cards from array response", () => {
    const cards: EntityCard[] = [];
    const tasksJson = JSON.stringify([
      { id: "t-1", title: "Task 1" },
      { id: "t-2", title: "Task 2" },
    ]);
    const event = makeFunctionResponseEvent("list_tasks", tasksJson);

    collectCards(event, cards);

    expect(cards).toHaveLength(2);
    expect(cards[0].data).toEqual({ id: "t-1", title: "Task 1" });
    expect(cards[1].data).toEqual({ id: "t-2", title: "Task 2" });
  });

  it("skips non-entity tools", () => {
    const cards: EntityCard[] = [];
    const event = makeFunctionResponseEvent("get_task_statistics", '"5 tasks"');

    collectCards(event, cards);

    expect(cards).toHaveLength(0);
  });

  it("skips error responses", () => {
    const cards: EntityCard[] = [];
    const event = makeFunctionResponseEvent("create_task", "Error: something went wrong");

    collectCards(event, cards);

    expect(cards).toHaveLength(0);
  });

  it("skips 'not found' responses", () => {
    const cards: EntityCard[] = [];
    const event = makeFunctionResponseEvent("get_task_by_id", "Task not found");

    collectCards(event, cards);

    expect(cards).toHaveLength(0);
  });

  it("skips 'No tasks' responses", () => {
    const cards: EntityCard[] = [];
    const event = makeFunctionResponseEvent("list_tasks", "No tasks found");

    collectCards(event, cards);

    expect(cards).toHaveLength(0);
  });

  it("handles nested response.output format", () => {
    const cards: EntityCard[] = [];
    const taskJson = JSON.stringify({ id: "t-1", title: "Test" });
    const event = makeFunctionResponseEvent("create_task", { output: taskJson });

    collectCards(event, cards);

    expect(cards).toHaveLength(1);
  });

  it("handles nested response.result format", () => {
    const cards: EntityCard[] = [];
    const taskJson = JSON.stringify({ id: "t-1", title: "Test" });
    const event = makeFunctionResponseEvent("create_task", { result: taskJson });

    collectCards(event, cards);

    expect(cards).toHaveLength(1);
  });

  it("skips invalid JSON gracefully", () => {
    const cards: EntityCard[] = [];
    const event = makeFunctionResponseEvent("create_task", "not json at all {");

    collectCards(event, cards);

    expect(cards).toHaveLength(0);
  });

  it("skips events without content.parts", () => {
    const cards: EntityCard[] = [];
    collectCards(createEvent(), cards);
    collectCards(createEvent({ content: {} }), cards);
    expect(cards).toHaveLength(0);
  });

  it("skips array items without id", () => {
    const cards: EntityCard[] = [];
    const json = JSON.stringify([{ title: "No id" }, { id: "t-1", title: "Has id" }]);
    const event = makeFunctionResponseEvent("list_tasks", json);

    collectCards(event, cards);

    expect(cards).toHaveLength(1);
    expect(cards[0].data).toEqual({ id: "t-1", title: "Has id" });
  });
});

// ---------------------------------------------------------------------------
// formatCards
// ---------------------------------------------------------------------------

describe("formatCards", () => {
  it("formats cards as custom XML tags", () => {
    const cards: EntityCard[] = [
      { type: "task", data: { id: "t-1", title: "Buy milk" } },
      { type: "note", data: { id: "n-1", title: "Note" } },
    ];

    const result = formatCards(cards);

    expect(result).toContain("<task-card>");
    expect(result).toContain("</task-card>");
    expect(result).toContain("<note-card>");
    expect(result).toContain("</note-card>");
    expect(result).toContain('"Buy milk"');
  });

  it("returns empty string for no cards", () => {
    expect(formatCards([])).toBe("");
  });
});

// ---------------------------------------------------------------------------
// extractRoutingAgent / formatRoutingInfo
// ---------------------------------------------------------------------------

describe("extractRoutingAgent", () => {
  it("extracts known agent name from author", () => {
    const event = createEvent({ author: "TaskAgent" });
    expect(extractRoutingAgent(event)).toBe("TaskAgent");
  });

  it("returns null for unknown author", () => {
    const event = createEvent({ author: "UnknownAgent" });
    expect(extractRoutingAgent(event)).toBeNull();
  });

  it("returns null when no author", () => {
    expect(extractRoutingAgent(createEvent())).toBeNull();
  });
});

describe("formatRoutingInfo", () => {
  it("wraps agent name in routing-info tags", () => {
    expect(formatRoutingInfo("TaskAgent")).toBe("<routing-info>TaskAgent</routing-info>");
  });
});
