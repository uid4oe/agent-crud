import { describe, it, expect, vi, beforeEach } from "vitest";
import { FunctionTool } from "@google/adk";
import { createTaskTools } from "./task.tools.js";
import { Task } from "../../../../domain/task/entities/task.entity.js";
import type { TaskRepositoryPort } from "../../../../domain/task/ports/task.repository.port.js";
import type { TaskProps } from "../../../../domain/task/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeTask(overrides: Partial<TaskProps> = {}): Task {
  return Task.reconstitute({
    id: "t-1",
    title: "Buy milk",
    description: "From the store",
    status: "pending",
    priority: "normal",
    dueDate: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function mockRepo(): TaskRepositoryPort {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByStatus: vi.fn(),
    findByTag: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAllTags: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
  };
}

// FunctionTool.execute is private in ADK types but accessible at runtime.
// We use a mapped extraction helper to avoid double-casting through unknown.
interface TestTool { name: string; execute: (args: Record<string, unknown>) => Promise<string> }

function toTestTools(adkTools: FunctionTool[]): TestTool[] {
  return adkTools.map((t) => ({
    name: t.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private execute for testing
    execute: (t as any).execute.bind(t) as TestTool["execute"],
  }));
}

function getTool(tools: TestTool[], name: string): TestTool {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Task AI tools", () => {
  let repo: ReturnType<typeof mockRepo>;
  let tools: TestTool[];

  beforeEach(() => {
    repo = mockRepo();
    tools = toTestTools(createTaskTools(repo));
  });

  it("creates 8 tools", () => {
    expect(tools).toHaveLength(8);
    const names = tools.map((t) => t.name);
    expect(names).toContain("list_tasks");
    expect(names).toContain("get_task_by_id");
    expect(names).toContain("search_tasks");
    expect(names).toContain("get_task_statistics");
    expect(names).toContain("create_task");
    expect(names).toContain("update_task");
    expect(names).toContain("delete_task");
    expect(names).toContain("bulk_update_tasks");
  });

  describe("list_tasks", () => {
    it("returns all tasks as JSON", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [makeTask()],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const result = await getTool(tools, "list_tasks").execute({});
      const parsed = JSON.parse(result as string);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Buy milk");
    });

    it("filters by status when provided", async () => {
      vi.mocked(repo.findByStatus).mockResolvedValue([makeTask({ status: "completed" })]);

      const result = await getTool(tools, "list_tasks").execute({ status: "completed" });
      const parsed = JSON.parse(result as string);

      expect(repo.findByStatus).toHaveBeenCalledWith("completed");
      expect(parsed[0].status).toBe("completed");
    });

    it("returns message when no tasks found", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0 });

      const result = await getTool(tools, "list_tasks").execute({});
      expect(result).toContain("No tasks found");
    });
  });

  describe("get_task_by_id", () => {
    it("returns task JSON when found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTask());

      const result = await getTool(tools, "get_task_by_id").execute({ id: "t-1" });
      const parsed = JSON.parse(result as string);

      expect(parsed.id).toBe("t-1");
    });

    it("returns not-found message when missing", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await getTool(tools, "get_task_by_id").execute({ id: "missing" });
      expect(result).toContain("not found");
    });
  });

  describe("search_tasks", () => {
    it("returns matching tasks", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeTask()]);

      const result = await getTool(tools, "search_tasks").execute({ query: "milk" });
      const parsed = JSON.parse(result as string);

      expect(parsed).toHaveLength(1);
      expect(repo.search).toHaveBeenCalledWith("milk", undefined);
    });

    it("returns message when no matches", async () => {
      vi.mocked(repo.search).mockResolvedValue([]);

      const result = await getTool(tools, "search_tasks").execute({ query: "xyz" });
      expect(result).toContain('No tasks found matching "xyz"');
    });
  });

  describe("get_task_statistics", () => {
    it("computes counts and completion rate", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [
          makeTask({ id: "1", status: "pending" }),
          makeTask({ id: "2", status: "completed" }),
          makeTask({ id: "3", status: "completed" }),
        ],
        total: 3,
        limit: 50,
        offset: 0,
      });

      const result = await getTool(tools, "get_task_statistics").execute({});
      const stats = JSON.parse(result as string);

      expect(stats.total).toBe(3);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.completed).toBe(2);
      expect(stats.completionRate).toBe(67);
    });
  });

  describe("create_task", () => {
    it("creates a task and returns JSON", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeTask());

      const result = await getTool(tools, "create_task").execute({
        title: "Buy milk",
        priority: "high",
      });
      const parsed = JSON.parse(result as string);

      expect(parsed.title).toBe("Buy milk");
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Buy milk", priority: "high" })
      );
    });
  });

  describe("update_task", () => {
    it("updates and returns JSON", async () => {
      vi.mocked(repo.update).mockResolvedValue(makeTask({ status: "completed" }));

      const result = await getTool(tools, "update_task").execute({
        id: "t-1",
        status: "completed",
      });
      const parsed = JSON.parse(result as string);

      expect(parsed.status).toBe("completed");
    });

    it("returns not-found when update returns null", async () => {
      vi.mocked(repo.update).mockResolvedValue(null);

      const result = await getTool(tools, "update_task").execute({ id: "x", title: "Y" });
      expect(result).toContain("not found");
    });
  });

  describe("delete_task", () => {
    it("deletes and returns success message", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTask());
      vi.mocked(repo.delete).mockResolvedValue(true);

      const result = await getTool(tools, "delete_task").execute({ id: "t-1" });
      expect(result).toContain("deleted successfully");
      expect(result).toContain("Buy milk");
    });

    it("returns not-found when task doesn't exist", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await getTool(tools, "delete_task").execute({ id: "x" });
      expect(result).toContain("not found");
    });
  });
});
