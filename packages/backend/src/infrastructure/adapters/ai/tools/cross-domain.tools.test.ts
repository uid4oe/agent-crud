import { describe, it, expect, vi } from "vitest";
import type { FunctionTool } from "@google/adk";
import { createCrossDomainTools } from "./cross-domain.tools.js";
import { Task } from "../../../../domain/task/entities/task.entity.js";
import { Note } from "../../../../domain/note/entities/note.entity.js";
import { Goal } from "../../../../domain/goal/entities/goal.entity.js";
import type { TaskRepositoryPort } from "../../../../domain/task/ports/task.repository.port.js";
import type { NoteRepositoryPort } from "../../../../domain/note/ports/note.repository.port.js";
import type { GoalRepositoryPort } from "../../../../domain/goal/ports/goal.repository.port.js";

// FunctionTool.execute is private in ADK types but accessible at runtime.
interface TestTool { name: string; execute: (args: Record<string, unknown>) => Promise<string> }

function toTestTools(adkTools: FunctionTool[]): TestTool[] {
  return adkTools.map((t) => ({
    name: t.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private execute for testing
    execute: (t as any).execute.bind(t) as TestTool["execute"],
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeTask() {
  return Task.reconstitute({
    id: "t-1", title: "Buy milk", description: null, status: "pending",
    priority: "normal", dueDate: null, tags: [], createdAt: now, updatedAt: now,
  });
}

function makeNote() {
  return Note.reconstitute({
    id: "n-1", title: "Meeting", content: "Notes", category: "meeting",
    tags: ["work"], createdAt: now, updatedAt: now,
  });
}

function makeGoal() {
  return Goal.reconstitute({
    id: "g-1", title: "Get fit", description: null, status: "active",
    category: "fitness", targetDate: null, milestones: [], createdAt: now, updatedAt: now,
  });
}

function mockTaskRepo(overrides: Partial<TaskRepositoryPort> = {}): TaskRepositoryPort {
  return {
    findAll: vi.fn(), findById: vi.fn(), findByStatus: vi.fn(), findByTag: vi.fn(),
    search: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    getAllTags: vi.fn(), bulkUpdate: vi.fn(), bulkDelete: vi.fn(),
    ...overrides,
  };
}

function mockNoteRepo(overrides: Partial<NoteRepositoryPort> = {}): NoteRepositoryPort {
  return {
    findAll: vi.fn(), findById: vi.fn(), findByCategory: vi.fn(), findByTag: vi.fn(),
    search: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    getAllTags: vi.fn(), bulkUpdate: vi.fn(), bulkDelete: vi.fn(),
    ...overrides,
  };
}

function mockGoalRepo(overrides: Partial<GoalRepositoryPort> = {}): GoalRepositoryPort {
  return {
    findAll: vi.fn(), findById: vi.fn(), findByStatus: vi.fn(), findByCategory: vi.fn(),
    search: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    toggleMilestone: vi.fn(), bulkDelete: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Cross-domain tools", () => {
  it("returns empty array when no repos provided", () => {
    const tools = createCrossDomainTools({});
    expect(tools).toHaveLength(0);
  });

  it("creates two tools per provided repository", () => {
    const tools = createCrossDomainTools({
      taskRepository: mockTaskRepo(),
      noteRepository: mockNoteRepo(),
    });
    expect(tools).toHaveLength(4);
    expect(tools.map((t) => t.name)).toContain("search_other_tasks");
    expect(tools.map((t) => t.name)).toContain("create_other_task");
    expect(tools.map((t) => t.name)).toContain("search_other_notes");
    expect(tools.map((t) => t.name)).toContain("create_other_note");
  });

  it("creates all three tools when all repos provided", () => {
    const tools = createCrossDomainTools({
      taskRepository: mockTaskRepo(),
      noteRepository: mockNoteRepo(),
      goalRepository: mockGoalRepo(),
    });
    expect(tools).toHaveLength(6);
  });

  describe("search_other_tasks", () => {
    it("returns limited fields (read-only)", async () => {
      const taskRepo = mockTaskRepo({ search: vi.fn().mockResolvedValue([makeTask()]) });
      const tools = toTestTools(createCrossDomainTools({ taskRepository: taskRepo }));
      const tool = tools.find((t) => t.name === "search_other_tasks")!;

      const result = await tool.execute({ query: "milk" });
      const parsed = JSON.parse(result as string);

      expect(parsed[0]).toEqual({
        id: "t-1",
        title: "Buy milk",
        status: "pending",
        priority: "normal",
      });
      // Should NOT include description, tags, timestamps
      expect(parsed[0].description).toBeUndefined();
      expect(parsed[0].createdAt).toBeUndefined();
    });

    it("returns max 5 results", async () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        Task.reconstitute({
          id: `t-${i}`, title: `Task ${i}`, description: null, status: "pending",
          priority: "normal", dueDate: null, tags: [], createdAt: now, updatedAt: now,
        })
      );
      const taskRepo = mockTaskRepo({ search: vi.fn().mockResolvedValue(tasks) });
      const tools = toTestTools(createCrossDomainTools({ taskRepository: taskRepo }));
      const tool = tools.find((t) => t.name === "search_other_tasks")!;

      const result = await tool.execute({ query: "task" });
      const parsed = JSON.parse(result as string);

      expect(parsed).toHaveLength(5);
    });

    it("returns message when no matches", async () => {
      const taskRepo = mockTaskRepo({ search: vi.fn().mockResolvedValue([]) });
      const tools = toTestTools(createCrossDomainTools({ taskRepository: taskRepo }));
      const tool = tools.find((t) => t.name === "search_other_tasks")!;

      const result = await tool.execute({ query: "xyz" });
      expect(result).toContain("No tasks found");
    });
  });

  describe("search_other_notes", () => {
    it("returns limited fields", async () => {
      const noteRepo = mockNoteRepo({ search: vi.fn().mockResolvedValue([makeNote()]) });
      const tools = toTestTools(createCrossDomainTools({ noteRepository: noteRepo }));
      const tool = tools.find((t) => t.name === "search_other_notes")!;

      const result = await tool.execute({ query: "meeting" });
      const parsed = JSON.parse(result as string);

      expect(parsed[0]).toEqual({
        id: "n-1",
        title: "Meeting",
        category: "meeting",
        tags: ["work"],
      });
      expect(parsed[0].content).toBeUndefined();
    });
  });

  describe("search_other_goals", () => {
    it("returns limited fields", async () => {
      const goalRepo = mockGoalRepo({ search: vi.fn().mockResolvedValue([makeGoal()]) });
      const tools = toTestTools(createCrossDomainTools({ goalRepository: goalRepo }));
      const tool = tools.find((t) => t.name === "search_other_goals")!;

      const result = await tool.execute({ query: "fit" });
      const parsed = JSON.parse(result as string);

      expect(parsed[0]).toEqual({
        id: "g-1",
        title: "Get fit",
        status: "active",
        category: "fitness",
      });
      expect(parsed[0].milestones).toBeUndefined();
    });
  });
});
