import type { FunctionTool } from "@google/adk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Goal } from "../../../../domain/goal/entities/goal.entity.js";
import type { GoalRepositoryPort } from "../../../../domain/goal/ports/goal.repository.port.js";
import type { GoalProps, MilestoneProps } from "../../../../domain/goal/types.js";
import { createGoalTools } from "./goal.tools.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeMilestone(overrides: Partial<MilestoneProps> = {}): MilestoneProps {
  return {
    id: "m-1",
    goalId: "g-1",
    title: "Run 5k",
    completed: false,
    sortOrder: 0,
    createdAt: now,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<GoalProps> = {}): Goal {
  return Goal.reconstitute({
    id: "g-1",
    title: "Get fit",
    description: "Improve overall fitness",
    status: "active",
    category: "fitness",
    targetDate: null,
    milestones: [makeMilestone()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function mockRepo(): GoalRepositoryPort {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByStatus: vi.fn(),
    findByCategory: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleMilestone: vi.fn(),
    bulkDelete: vi.fn(),
  };
}

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

describe("Goal AI tools", () => {
  let repo: ReturnType<typeof mockRepo>;
  let tools: TestTool[];

  beforeEach(() => {
    repo = mockRepo();
    tools = toTestTools(createGoalTools(repo));
  });

  it("creates 8 tools", () => {
    expect(tools).toHaveLength(8);
    const names = tools.map((t) => t.name);
    expect(names).toContain("list_goals");
    expect(names).toContain("get_goal_by_id");
    expect(names).toContain("search_goals");
    expect(names).toContain("get_goal_statistics");
    expect(names).toContain("create_goal");
    expect(names).toContain("update_goal");
    expect(names).toContain("delete_goal");
    expect(names).toContain("toggle_milestone");
  });

  describe("list_goals", () => {
    it("returns all goals as JSON", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [makeGoal()],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const result = await getTool(tools, "list_goals").execute({});
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Get fit");
    });

    it("filters by status when provided", async () => {
      vi.mocked(repo.findByStatus).mockResolvedValue([makeGoal({ status: "completed" })]);

      const result = await getTool(tools, "list_goals").execute({ status: "completed" });
      const parsed = JSON.parse(result);

      expect(repo.findByStatus).toHaveBeenCalledWith("completed");
      expect(parsed[0].status).toBe("completed");
    });

    it("filters by category when provided", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([makeGoal({ category: "nutrition" })]);

      const result = await getTool(tools, "list_goals").execute({ category: "nutrition" });
      const parsed = JSON.parse(result);

      expect(repo.findByCategory).toHaveBeenCalledWith("nutrition");
      expect(parsed[0].category).toBe("nutrition");
    });

    it("returns message when no goals found", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0 });

      const result = await getTool(tools, "list_goals").execute({});
      expect(result).toContain("No goals found");
    });

    it("returns status-specific message when filtered and empty", async () => {
      vi.mocked(repo.findByStatus).mockResolvedValue([]);

      const result = await getTool(tools, "list_goals").execute({ status: "abandoned" });
      expect(result).toContain("abandoned");
    });

    it("returns category-specific message when filtered and empty", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([]);

      const result = await getTool(tools, "list_goals").execute({ category: "sleep" });
      expect(result).toContain("sleep");
    });
  });

  describe("get_goal_by_id", () => {
    it("returns goal JSON with milestones when found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());

      const result = await getTool(tools, "get_goal_by_id").execute({ id: "g-1" });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe("g-1");
      expect(parsed.milestones).toHaveLength(1);
      expect(parsed.milestones[0].title).toBe("Run 5k");
    });

    it("returns not-found message when missing", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await getTool(tools, "get_goal_by_id").execute({ id: "missing" });
      expect(result).toContain("not found");
    });
  });

  describe("search_goals", () => {
    it("returns matching goals", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeGoal()]);

      const result = await getTool(tools, "search_goals").execute({ query: "fit" });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(1);
      expect(repo.search).toHaveBeenCalledWith("fit", undefined);
    });

    it("passes status filter to search", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeGoal()]);

      await getTool(tools, "search_goals").execute({ query: "fit", status: "active" });
      expect(repo.search).toHaveBeenCalledWith("fit", "active");
    });

    it("returns message when no matches", async () => {
      vi.mocked(repo.search).mockResolvedValue([]);

      const result = await getTool(tools, "search_goals").execute({ query: "xyz" });
      expect(result).toContain('No goals found matching "xyz"');
    });
  });

  describe("get_goal_statistics", () => {
    it("computes counts by status, category, and milestone progress", async () => {
      const goals = [
        makeGoal({
          id: "1",
          status: "active",
          category: "fitness",
          milestones: [
            makeMilestone({ id: "m-1", completed: true }),
            makeMilestone({ id: "m-2", completed: false }),
          ],
        }),
        makeGoal({
          id: "2",
          status: "completed",
          category: "nutrition",
          milestones: [],
        }),
      ];

      vi.mocked(repo.findAll).mockResolvedValue({
        data: goals,
        total: 2,
        limit: 50,
        offset: 0,
      });

      const result = await getTool(tools, "get_goal_statistics").execute({});
      const stats = JSON.parse(result);

      expect(stats.total).toBe(2);
      expect(stats.byStatus.active).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.byCategory.fitness).toBe(1);
      expect(stats.byCategory.nutrition).toBe(1);
      expect(stats.milestoneProgress).toHaveLength(2);
      expect(stats.milestoneProgress[0].total).toBe(2);
      expect(stats.milestoneProgress[0].completed).toBe(1);
    });
  });

  describe("create_goal", () => {
    it("creates a goal and returns JSON", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal());

      const result = await getTool(tools, "create_goal").execute({
        title: "Get fit",
        description: "Improve overall fitness",
        category: "fitness",
      });
      const parsed = JSON.parse(result);

      expect(parsed.title).toBe("Get fit");
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Get fit", status: "active" })
      );
    });

    it("creates goal with milestones", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal());

      await getTool(tools, "create_goal").execute({
        title: "Get fit",
        milestones: [{ title: "Run 5k" }, { title: "Run 10k" }],
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          milestones: [
            { title: "Run 5k", sortOrder: 0 },
            { title: "Run 10k", sortOrder: 1 },
          ],
        })
      );
    });

    it("defaults category to other when not provided", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal({ category: "other" }));

      await getTool(tools, "create_goal").execute({ title: "Something" });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ category: "other" })
      );
    });
  });

  describe("update_goal", () => {
    it("updates and returns JSON", async () => {
      vi.mocked(repo.update).mockResolvedValue(makeGoal({ status: "completed" }));

      const result = await getTool(tools, "update_goal").execute({
        id: "g-1",
        status: "completed",
      });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("completed");
    });

    it("updates milestones with sort order", async () => {
      vi.mocked(repo.update).mockResolvedValue(makeGoal());

      await getTool(tools, "update_goal").execute({
        id: "g-1",
        milestones: [
          { title: "Step 1", completed: true },
          { title: "Step 2" },
        ],
      });

      expect(repo.update).toHaveBeenCalledWith(
        "g-1",
        expect.objectContaining({
          milestones: [
            { title: "Step 1", completed: true, sortOrder: 0 },
            { title: "Step 2", completed: false, sortOrder: 1 },
          ],
        })
      );
    });

    it("returns not-found when update returns null", async () => {
      vi.mocked(repo.update).mockResolvedValue(null);

      const result = await getTool(tools, "update_goal").execute({ id: "x", title: "Y" });
      expect(result).toContain("not found");
    });
  });

  describe("delete_goal", () => {
    it("deletes and returns success message", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      vi.mocked(repo.delete).mockResolvedValue(true);

      const result = await getTool(tools, "delete_goal").execute({ id: "g-1" });
      expect(result).toContain("deleted successfully");
      expect(result).toContain("Get fit");
    });

    it("returns not-found when goal doesn't exist", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await getTool(tools, "delete_goal").execute({ id: "x" });
      expect(result).toContain("not found");
    });
  });

  describe("toggle_milestone", () => {
    it("toggles milestone and returns updated goal JSON", async () => {
      const toggled = makeGoal({
        milestones: [makeMilestone({ completed: true })],
      });
      vi.mocked(repo.toggleMilestone).mockResolvedValue(toggled);

      const result = await getTool(tools, "toggle_milestone").execute({
        goalId: "g-1",
        milestoneId: "m-1",
      });
      const parsed = JSON.parse(result);

      expect(parsed.milestones[0].completed).toBe(true);
      expect(repo.toggleMilestone).toHaveBeenCalledWith("g-1", "m-1");
    });

    it("returns not-found when goal or milestone missing", async () => {
      vi.mocked(repo.toggleMilestone).mockResolvedValue(null);

      const result = await getTool(tools, "toggle_milestone").execute({
        goalId: "g-1",
        milestoneId: "m-999",
      });
      expect(result).toContain("not found");
    });
  });
});
