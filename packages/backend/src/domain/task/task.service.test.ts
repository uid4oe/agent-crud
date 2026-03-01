import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskService } from "./task.service.js";
import type { TaskRepositoryPort } from "./ports/task.repository.port.js";
import { Task } from "./entities/task.entity.js";
import { TaskNotFoundError, TaskTitleRequiredError } from "../shared/errors/index.js";
import type { TaskProps } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeTaskProps(overrides: Partial<TaskProps> = {}): TaskProps {
  return {
    id: "task-1",
    title: "Buy groceries",
    description: "Milk, eggs, bread",
    status: "pending",
    priority: "normal",
    dueDate: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeTask(overrides: Partial<TaskProps> = {}): Task {
  return Task.reconstitute(makeTaskProps(overrides));
}

function createMockRepository(): TaskRepositoryPort {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskService", () => {
  let service: TaskService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repo = createMockRepository();
    service = new TaskService(repo);
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------

  describe("list", () => {
    it("returns paginated tasks when no status filter", async () => {
      const tasks = [makeTask(), makeTask({ id: "task-2", title: "Do laundry" })];
      const paginated = { data: tasks, total: 2, limit: 50, offset: 0 };
      vi.mocked(repo.findAll).mockResolvedValue(paginated);

      const result = await service.list();

      expect(repo.findAll).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("filters by status when provided", async () => {
      const tasks = [makeTask({ status: "completed" })];
      vi.mocked(repo.findByStatus).mockResolvedValue(tasks);

      const result = await service.list({ status: "completed" });

      expect(repo.findByStatus).toHaveBeenCalledWith("completed");
      expect(result.data).toHaveLength(1);
      expect(repo.findAll).not.toHaveBeenCalled();
    });

    it("passes pagination params through", async () => {
      const paginated = { data: [], total: 0, limit: 10, offset: 20 };
      vi.mocked(repo.findAll).mockResolvedValue(paginated);

      await service.list({}, { limit: 10, offset: 20 });

      expect(repo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 20 });
    });
  });

  // -----------------------------------------------------------------------
  // get / findById
  // -----------------------------------------------------------------------

  describe("get", () => {
    it("returns the task when found", async () => {
      const task = makeTask();
      vi.mocked(repo.findById).mockResolvedValue(task);

      const result = await service.get({ id: "task-1" });

      expect(result.id).toBe("task-1");
      expect(result.title).toBe("Buy groceries");
    });

    it("throws TaskNotFoundError when not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.get({ id: "missing" })).rejects.toThrow(TaskNotFoundError);
    });
  });

  describe("findById", () => {
    it("returns null when not found (non-throwing)", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await service.findById("missing");

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------

  describe("create", () => {
    it("creates a task with defaults", async () => {
      const created = makeTask();
      vi.mocked(repo.create).mockResolvedValue(created);

      const result = await service.create({ title: "Buy groceries" });

      expect(repo.create).toHaveBeenCalledWith({
        title: "Buy groceries",
        description: null,
        status: "pending",
        priority: "normal",
        dueDate: undefined,
        tags: undefined,
      });
      expect(result.title).toBe("Buy groceries");
    });

    it("trims the title", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeTask());

      await service.create({ title: "  Buy groceries  " });

      expect(vi.mocked(repo.create).mock.calls[0][0].title).toBe("Buy groceries");
    });

    it("throws TaskTitleRequiredError for empty title", async () => {
      await expect(service.create({ title: "" })).rejects.toThrow(TaskTitleRequiredError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("throws TaskTitleRequiredError for whitespace-only title", async () => {
      await expect(service.create({ title: "   " })).rejects.toThrow(TaskTitleRequiredError);
    });

    it("passes optional fields through", async () => {
      vi.mocked(repo.create).mockResolvedValue(
        makeTask({ status: "in_progress", priority: "high", tags: ["urgent"] })
      );

      await service.create({
        title: "Urgent task",
        status: "in_progress",
        priority: "high",
        tags: ["urgent"],
        description: "Do it now",
      });

      expect(vi.mocked(repo.create).mock.calls[0][0]).toMatchObject({
        status: "in_progress",
        priority: "high",
        tags: ["urgent"],
        description: "Do it now",
      });
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------

  describe("update", () => {
    it("updates a task when it exists", async () => {
      const existing = makeTask();
      const updated = makeTask({ title: "Updated title" });
      vi.mocked(repo.findById).mockResolvedValue(existing);
      vi.mocked(repo.update).mockResolvedValue(updated);

      const result = await service.update({ id: "task-1", title: "Updated title" });

      expect(repo.update).toHaveBeenCalledWith("task-1", { title: "Updated title" });
      expect(result.title).toBe("Updated title");
    });

    it("throws TaskNotFoundError if task doesn't exist", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.update({ id: "missing", title: "X" })).rejects.toThrow(
        TaskNotFoundError
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("throws TaskTitleRequiredError for empty title update", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTask());

      await expect(service.update({ id: "task-1", title: "  " })).rejects.toThrow(
        TaskTitleRequiredError
      );
    });

    it("only includes provided fields in update", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTask());
      vi.mocked(repo.update).mockResolvedValue(makeTask({ status: "completed" }));

      await service.update({ id: "task-1", status: "completed" });

      expect(vi.mocked(repo.update).mock.calls[0][1]).toEqual({ status: "completed" });
    });

    it("handles null description update (clearing field)", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTask());
      vi.mocked(repo.update).mockResolvedValue(makeTask({ description: null }));

      await service.update({ id: "task-1", description: null });

      expect(vi.mocked(repo.update).mock.calls[0][1]).toEqual({ description: null });
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------

  describe("delete", () => {
    it("deletes an existing task", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeTask());
      vi.mocked(repo.delete).mockResolvedValue(true);

      const result = await service.delete({ id: "task-1" });

      expect(result).toBe(true);
      expect(repo.delete).toHaveBeenCalledWith("task-1");
    });

    it("throws TaskNotFoundError if task doesn't exist", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.delete({ id: "missing" })).rejects.toThrow(TaskNotFoundError);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // search
  // -----------------------------------------------------------------------

  describe("search", () => {
    it("delegates to repository", async () => {
      const tasks = [makeTask()];
      vi.mocked(repo.search).mockResolvedValue(tasks);

      const result = await service.search("groceries");

      expect(repo.search).toHaveBeenCalledWith("groceries", undefined);
      expect(result).toHaveLength(1);
    });

    it("passes status filter to search", async () => {
      vi.mocked(repo.search).mockResolvedValue([]);

      await service.search("groceries", "completed");

      expect(repo.search).toHaveBeenCalledWith("groceries", "completed");
    });
  });

  // -----------------------------------------------------------------------
  // bulk operations
  // -----------------------------------------------------------------------

  describe("bulkUpdate", () => {
    it("delegates to repository", async () => {
      vi.mocked(repo.bulkUpdate).mockResolvedValue(3);

      const result = await service.bulkUpdate(["1", "2", "3"], { status: "completed" });

      expect(result).toBe(3);
      expect(repo.bulkUpdate).toHaveBeenCalledWith(["1", "2", "3"], { status: "completed" });
    });
  });

  describe("bulkDelete", () => {
    it("delegates to repository", async () => {
      vi.mocked(repo.bulkDelete).mockResolvedValue(2);

      const result = await service.bulkDelete(["1", "2"]);

      expect(result).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// Entity unit tests
// ---------------------------------------------------------------------------

describe("Task entity", () => {
  const props = (): TaskProps => ({
    id: "t-1",
    title: "Test",
    description: null,
    status: "pending",
    priority: "normal",
    dueDate: null,
    tags: ["a", "b"],
    createdAt: now,
    updatedAt: now,
  });

  it("creates via factory with validation", () => {
    const task = Task.create(props());
    expect(task.title).toBe("Test");
    expect(task.status).toBe("pending");
  });

  it("rejects empty title", () => {
    expect(() => Task.create({ ...props(), title: "" })).toThrow(TaskTitleRequiredError);
  });

  it("rejects invalid status", () => {
    expect(() => Task.create({ ...props(), status: "invalid" as never })).toThrow();
  });

  it("reconstitutes without validation (from DB)", () => {
    const task = Task.reconstitute(props());
    expect(task.id).toBe("t-1");
  });

  it("returns defensive copy of tags", () => {
    const task = Task.create(props());
    const tags = task.tags;
    tags.push("mutated");
    expect(task.tags).toEqual(["a", "b"]);
  });

  it("updateTitle returns new instance", () => {
    const task = Task.create(props());
    const updated = task.updateTitle("New title");
    expect(updated.title).toBe("New title");
    expect(task.title).toBe("Test"); // original unchanged
  });

  it("markAsCompleted transitions status", () => {
    const task = Task.create(props());
    const completed = task.markAsCompleted();
    expect(completed.status).toBe("completed");
    expect(task.status).toBe("pending");
  });

  it("toJSON returns plain object", () => {
    const task = Task.create(props());
    const json = task.toJSON();
    expect(json.id).toBe("t-1");
    expect(json.tags).toEqual(["a", "b"]);
  });
});
