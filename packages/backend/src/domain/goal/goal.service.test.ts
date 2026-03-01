import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoalService } from "./goal.service.js";
import type { GoalRepositoryPort } from "./ports/goal.repository.port.js";
import { Goal } from "./entities/goal.entity.js";
import {
  GoalNotFoundError,
  GoalTitleRequiredError,
} from "../shared/errors/index.js";
import type { GoalProps, MilestoneProps } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeMilestone(overrides: Partial<MilestoneProps> = {}): MilestoneProps {
  return {
    id: "ms-1",
    goalId: "goal-1",
    title: "Run 5km",
    completed: false,
    sortOrder: 0,
    createdAt: now,
    ...overrides,
  };
}

function makeGoalProps(overrides: Partial<GoalProps> = {}): GoalProps {
  return {
    id: "goal-1",
    title: "Get fit",
    description: "Improve overall fitness",
    status: "active",
    category: "fitness",
    targetDate: new Date("2026-06-01"),
    milestones: [makeMilestone()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<GoalProps> = {}): Goal {
  return Goal.reconstitute(makeGoalProps(overrides));
}

function createMockRepository(): GoalRepositoryPort {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByStatus: vi.fn(),
    findByCategory: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleMilestone: vi.fn(),
    delete: vi.fn(),
    bulkDelete: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Service Tests
// ---------------------------------------------------------------------------

describe("GoalService", () => {
  let service: GoalService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repo = createMockRepository();
    service = new GoalService(repo);
  });

  describe("list", () => {
    it("returns all goals without filters", async () => {
      const paginated = { data: [makeGoal()], total: 1, limit: 50, offset: 0 };
      vi.mocked(repo.findAll).mockResolvedValue(paginated);

      const result = await service.list();
      expect(result.total).toBe(1);
    });

    it("filters by status", async () => {
      vi.mocked(repo.findByStatus).mockResolvedValue([makeGoal()]);

      const result = await service.list({ status: "active" });

      expect(repo.findByStatus).toHaveBeenCalledWith("active");
      expect(result.data).toHaveLength(1);
    });

    it("filters by category", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([makeGoal()]);

      const result = await service.list({ category: "fitness" });

      expect(repo.findByCategory).toHaveBeenCalledWith("fitness");
      expect(result.data).toHaveLength(1);
    });

    it("prefers status filter over category", async () => {
      vi.mocked(repo.findByStatus).mockResolvedValue([]);

      await service.list({ status: "active", category: "fitness" });

      expect(repo.findByStatus).toHaveBeenCalled();
      expect(repo.findByCategory).not.toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("returns goal when found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      const result = await service.get({ id: "goal-1" });
      expect(result.title).toBe("Get fit");
    });

    it("throws GoalNotFoundError when not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.get({ id: "missing" })).rejects.toThrow(GoalNotFoundError);
    });
  });

  describe("create", () => {
    it("creates with defaults", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal());

      await service.create({ title: "Get fit" });

      expect(vi.mocked(repo.create).mock.calls[0][0]).toMatchObject({
        title: "Get fit",
        description: null,
        status: "active",
        category: "other",
        milestones: [],
      });
    });

    it("trims the title", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal());

      await service.create({ title: "  Get fit  " });

      expect(vi.mocked(repo.create).mock.calls[0][0].title).toBe("Get fit");
    });

    it("rejects empty title", async () => {
      await expect(service.create({ title: "" })).rejects.toThrow(GoalTitleRequiredError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("parses targetDate string to Date", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal());

      await service.create({ title: "Goal", targetDate: "2026-06-01" });

      const created = vi.mocked(repo.create).mock.calls[0][0];
      expect(created.targetDate).toBeInstanceOf(Date);
    });

    it("passes milestones through", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeGoal());

      await service.create({
        title: "Goal",
        milestones: [{ title: "Step 1" }, { title: "Step 2" }],
      });

      expect(vi.mocked(repo.create).mock.calls[0][0].milestones).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("updates when goal exists", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      vi.mocked(repo.update).mockResolvedValue(makeGoal({ status: "completed" }));

      const result = await service.update({ id: "goal-1", status: "completed" });
      expect(result.status).toBe("completed");
    });

    it("throws GoalNotFoundError if not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.update({ id: "x", title: "X" })).rejects.toThrow(GoalNotFoundError);
    });

    it("rejects empty title update", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      await expect(service.update({ id: "goal-1", title: "  " })).rejects.toThrow(
        GoalTitleRequiredError
      );
    });

    it("converts targetDate string to Date", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      vi.mocked(repo.update).mockResolvedValue(makeGoal());

      await service.update({ id: "goal-1", targetDate: "2026-12-01" });

      const updateArg = vi.mocked(repo.update).mock.calls[0][1];
      expect(updateArg.targetDate).toBeInstanceOf(Date);
    });

    it("clears targetDate with null", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      vi.mocked(repo.update).mockResolvedValue(makeGoal({ targetDate: null }));

      await service.update({ id: "goal-1", targetDate: null });

      expect(vi.mocked(repo.update).mock.calls[0][1].targetDate).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes an existing goal", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeGoal());
      vi.mocked(repo.delete).mockResolvedValue(true);

      const result = await service.delete({ id: "goal-1" });
      expect(result).toBe(true);
    });

    it("throws GoalNotFoundError if not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.delete({ id: "x" })).rejects.toThrow(GoalNotFoundError);
    });
  });

  describe("toggleMilestone", () => {
    it("delegates to repository", async () => {
      const toggled = makeGoal({
        milestones: [makeMilestone({ completed: true })],
      });
      vi.mocked(repo.toggleMilestone).mockResolvedValue(toggled);

      const result = await service.toggleMilestone({
        goalId: "goal-1",
        milestoneId: "ms-1",
      });

      expect(repo.toggleMilestone).toHaveBeenCalledWith("goal-1", "ms-1");
      expect(result.milestones[0].completed).toBe(true);
    });

    it("throws GoalNotFoundError if repo returns null", async () => {
      vi.mocked(repo.toggleMilestone).mockResolvedValue(null);

      await expect(
        service.toggleMilestone({ goalId: "x", milestoneId: "ms-1" })
      ).rejects.toThrow(GoalNotFoundError);
    });
  });

  describe("search", () => {
    it("searches with query and optional status", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeGoal()]);

      const result = await service.search("fit", "active");

      expect(repo.search).toHaveBeenCalledWith("fit", "active");
      expect(result).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Entity Tests
// ---------------------------------------------------------------------------

describe("Goal entity", () => {
  const props = (): GoalProps => ({
    id: "g-1",
    title: "Get fit",
    description: null,
    status: "active",
    category: "fitness",
    targetDate: null,
    milestones: [
      {
        id: "ms-1",
        goalId: "g-1",
        title: "Run 5km",
        completed: false,
        sortOrder: 0,
        createdAt: now,
      },
      {
        id: "ms-2",
        goalId: "g-1",
        title: "Run 10km",
        completed: true,
        sortOrder: 1,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  it("creates with validation", () => {
    const goal = Goal.create(props());
    expect(goal.title).toBe("Get fit");
    expect(goal.milestones).toHaveLength(2);
  });

  it("rejects empty title", () => {
    expect(() => Goal.create({ ...props(), title: "" })).toThrow(GoalTitleRequiredError);
  });

  it("rejects invalid status", () => {
    expect(() => Goal.create({ ...props(), status: "bad" as never })).toThrow();
  });

  it("rejects invalid category", () => {
    expect(() => Goal.create({ ...props(), category: "bad" as never })).toThrow();
  });

  it("calculates progress correctly", () => {
    const goal = Goal.create(props());
    expect(goal.progress).toEqual({ completed: 1, total: 2, percentage: 50 });
  });

  it("returns 0% progress with no milestones", () => {
    const goal = Goal.create({ ...props(), milestones: [] });
    expect(goal.progress).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it("toggleMilestone flips completion", () => {
    const goal = Goal.create(props());
    const toggled = goal.toggleMilestone("ms-1");
    expect(toggled.milestones[0].completed).toBe(true);
    expect(goal.milestones[0].completed).toBe(false); // original unchanged
  });

  it("addMilestone appends to list", () => {
    const goal = Goal.create({ ...props(), milestones: [] });
    const updated = goal.addMilestone({ title: "New milestone" });
    expect(updated.milestones).toHaveLength(1);
    expect(updated.milestones[0].title).toBe("New milestone");
  });

  it("removeMilestone filters by id", () => {
    const goal = Goal.create(props());
    const updated = goal.removeMilestone("ms-1");
    expect(updated.milestones).toHaveLength(1);
    expect(updated.milestones[0].id).toBe("ms-2");
  });

  it("returns defensive copy of milestones", () => {
    const goal = Goal.create(props());
    const ms = goal.milestones;
    ms.push(makeMilestone({ id: "ms-3" }));
    expect(goal.milestones).toHaveLength(2);
  });
});
