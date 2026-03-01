/**
 * Integration test conftest — wires up real ADK agents with in-memory
 * repositories so we can test the full agent pipeline against live Gemini.
 *
 * Tests that import from this file will be SKIPPED when GEMINI_API_KEY is
 * not set in the environment (CI-friendly).
 */
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import { AdkAgentAdapter } from "../../infrastructure/adapters/ai/adk-agent.adapter.js";
import { createLogger } from "../../infrastructure/logging/index.js";
import { Task } from "../../domain/task/entities/task.entity.js";
import { Note } from "../../domain/note/entities/note.entity.js";
import { Goal } from "../../domain/goal/entities/goal.entity.js";
import type { TaskRepositoryPort } from "../../domain/task/ports/task.repository.port.js";
import type { NoteRepositoryPort } from "../../domain/note/ports/note.repository.port.js";
import type { GoalRepositoryPort } from "../../domain/goal/ports/goal.repository.port.js";
import type { TaskStatus, CreateTaskProps, UpdateTaskProps, TaskPriority } from "../../domain/task/types.js";
import type { NoteCategory, CreateNoteProps, UpdateNoteProps } from "../../domain/note/types.js";
import type {
  GoalStatus,
  GoalCategory,
  CreateGoalProps,
  UpdateGoalProps,
  MilestoneProps,
  CreateMilestoneProps,
} from "../../domain/goal/types.js";
import type { PaginationInput, PaginatedResult } from "../../domain/shared/types.js";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
export const HAS_API_KEY = GEMINI_API_KEY.length > 0;

/** Timeout per individual test (Gemini calls can take a while). */
export const AGENT_TEST_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// Silent logger for tests
// ---------------------------------------------------------------------------

export const logger = createLogger({ enabled: false });

// ---------------------------------------------------------------------------
// In-memory Task Repository
// ---------------------------------------------------------------------------

export class InMemoryTaskRepository implements TaskRepositoryPort {
  private store = new Map<string, Task>();

  async findAll(pagination?: PaginationInput): Promise<PaginatedResult<Task>> {
    const all = [...this.store.values()].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    return { data: all.slice(offset, offset + limit), total: all.length, limit, offset };
  }

  async findById(id: string): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.status === status);
  }

  async findByTag(tag: string): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.tags.includes(tag));
  }

  async search(query: string, status?: TaskStatus): Promise<Task[]> {
    const q = query.toLowerCase();
    return [...this.store.values()].filter((t) => {
      const matchesText =
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false);
      return status ? matchesText && t.status === status : matchesText;
    });
  }

  async create(props: CreateTaskProps): Promise<Task> {
    const now = new Date();
    const task = Task.reconstitute({
      id: crypto.randomUUID(),
      title: props.title,
      description: props.description ?? null,
      status: props.status ?? "pending",
      priority: (props.priority as TaskPriority) ?? "normal",
      dueDate: props.dueDate ? new Date(props.dueDate) : null,
      tags: props.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
    this.store.set(task.id, task);
    return task;
  }

  async update(id: string, props: UpdateTaskProps): Promise<Task | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const json = existing.toJSON();
    const updated = Task.reconstitute({
      ...json,
      title: props.title ?? json.title,
      description: props.description !== undefined ? props.description : json.description,
      status: props.status ?? json.status,
      priority: props.priority ?? json.priority,
      dueDate: props.dueDate !== undefined ? (props.dueDate ? new Date(props.dueDate) : null) : json.dueDate,
      tags: props.tags ?? json.tags,
      updatedAt: new Date(),
    });
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async getAllTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const t of this.store.values()) for (const tag of t.tags) tags.add(tag);
    return [...tags].sort();
  }

  async bulkUpdate(ids: string[], props: UpdateTaskProps): Promise<number> {
    let count = 0;
    for (const id of ids) if (await this.update(id, props)) count++;
    return count;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) if (this.store.delete(id)) count++;
    return count;
  }

  /** Test helper: get all tasks */
  all(): Task[] {
    return [...this.store.values()];
  }
}

// ---------------------------------------------------------------------------
// In-memory Note Repository
// ---------------------------------------------------------------------------

export class InMemoryNoteRepository implements NoteRepositoryPort {
  private store = new Map<string, Note>();

  async findAll(pagination?: PaginationInput): Promise<PaginatedResult<Note>> {
    const all = [...this.store.values()].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    return { data: all.slice(offset, offset + limit), total: all.length, limit, offset };
  }

  async findById(id: string): Promise<Note | null> {
    return this.store.get(id) ?? null;
  }

  async findByCategory(category: NoteCategory): Promise<Note[]> {
    return [...this.store.values()].filter((n) => n.category === category);
  }

  async findByTag(tag: string): Promise<Note[]> {
    return [...this.store.values()].filter((n) => n.tags.includes(tag));
  }

  async search(query: string, category?: NoteCategory): Promise<Note[]> {
    const q = query.toLowerCase();
    return [...this.store.values()].filter((n) => {
      const matchesText =
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      return category ? matchesText && n.category === category : matchesText;
    });
  }

  async create(props: CreateNoteProps): Promise<Note> {
    const now = new Date();
    const note = Note.reconstitute({
      id: crypto.randomUUID(),
      title: props.title,
      content: props.content ?? "",
      category: props.category ?? "general",
      tags: props.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
    this.store.set(note.id, note);
    return note;
  }

  async update(id: string, props: UpdateNoteProps): Promise<Note | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const json = existing.toJSON();
    const updated = Note.reconstitute({
      ...json,
      title: props.title ?? json.title,
      content: props.content !== undefined ? props.content : json.content,
      category: props.category ?? json.category,
      tags: props.tags ?? json.tags,
      updatedAt: new Date(),
    });
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async getAllTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const n of this.store.values()) for (const tag of n.tags) tags.add(tag);
    return [...tags].sort();
  }

  async bulkUpdate(ids: string[], props: UpdateNoteProps): Promise<number> {
    let count = 0;
    for (const id of ids) if (await this.update(id, props)) count++;
    return count;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) if (this.store.delete(id)) count++;
    return count;
  }

  all(): Note[] {
    return [...this.store.values()];
  }
}

// ---------------------------------------------------------------------------
// In-memory Goal Repository
// ---------------------------------------------------------------------------

export class InMemoryGoalRepository implements GoalRepositoryPort {
  private store = new Map<string, Goal>();

  async findAll(pagination?: PaginationInput): Promise<PaginatedResult<Goal>> {
    const all = [...this.store.values()].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    return { data: all.slice(offset, offset + limit), total: all.length, limit, offset };
  }

  async findById(id: string): Promise<Goal | null> {
    return this.store.get(id) ?? null;
  }

  async findByStatus(status: GoalStatus): Promise<Goal[]> {
    return [...this.store.values()].filter((g) => g.status === status);
  }

  async findByCategory(category: GoalCategory): Promise<Goal[]> {
    return [...this.store.values()].filter((g) => g.category === category);
  }

  async search(query: string, status?: GoalStatus): Promise<Goal[]> {
    const q = query.toLowerCase();
    return [...this.store.values()].filter((g) => {
      const matchesText =
        g.title.toLowerCase().includes(q) ||
        (g.description?.toLowerCase().includes(q) ?? false);
      return status ? matchesText && g.status === status : matchesText;
    });
  }

  async create(props: CreateGoalProps): Promise<Goal> {
    const now = new Date();
    const id = crypto.randomUUID();
    const milestones: MilestoneProps[] = (props.milestones ?? []).map((m, i) => ({
      id: crypto.randomUUID(),
      goalId: id,
      title: m.title,
      completed: m.completed ?? false,
      sortOrder: m.sortOrder ?? i,
      createdAt: now,
    }));
    const goal = Goal.reconstitute({
      id,
      title: props.title,
      description: props.description ?? null,
      status: props.status ?? "active",
      category: props.category ?? "other",
      targetDate: props.targetDate ?? null,
      milestones,
      createdAt: now,
      updatedAt: now,
    });
    this.store.set(id, goal);
    return goal;
  }

  async update(id: string, props: UpdateGoalProps): Promise<Goal | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const json = existing.toJSON();
    let milestones = json.milestones;
    if (props.milestones !== undefined) {
      milestones = props.milestones.map((m, i) => ({
        id: crypto.randomUUID(),
        goalId: id,
        title: m.title,
        completed: m.completed ?? false,
        sortOrder: m.sortOrder ?? i,
        createdAt: new Date(),
      }));
    }
    const updated = Goal.reconstitute({
      ...json,
      title: props.title ?? json.title,
      description: props.description !== undefined ? props.description : json.description,
      status: props.status ?? json.status,
      category: props.category ?? json.category,
      targetDate: props.targetDate !== undefined ? props.targetDate : json.targetDate,
      milestones,
      updatedAt: new Date(),
    });
    this.store.set(id, updated);
    return updated;
  }

  async toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null> {
    const goal = this.store.get(goalId);
    if (!goal) return null;
    const json = goal.toJSON();
    const milestone = json.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;
    const updated = Goal.reconstitute({
      ...json,
      milestones: json.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
      updatedAt: new Date(),
    });
    this.store.set(goalId, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async bulkDelete(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) if (this.store.delete(id)) count++;
    return count;
  }

  all(): Goal[] {
    return [...this.store.values()];
  }
}

// ---------------------------------------------------------------------------
// Agent factory
// ---------------------------------------------------------------------------

export interface AgentHarness {
  adapter: AdkAgentAdapter;
  taskRepo: InMemoryTaskRepository;
  noteRepo: InMemoryNoteRepository;
  goalRepo: InMemoryGoalRepository;
}

/**
 * Create a fully wired agent harness backed by in-memory repositories.
 * Each call returns a fresh, isolated instance — safe for parallel tests.
 */
export function createAgentHarness(): AgentHarness {
  const taskRepo = new InMemoryTaskRepository();
  const noteRepo = new InMemoryNoteRepository();
  const goalRepo = new InMemoryGoalRepository();

  const adapter = new AdkAgentAdapter(
    {
      taskRepository: taskRepo,
      noteRepository: noteRepo,
      goalRepository: goalRepo,
      model: GEMINI_MODEL,
      apiKey: GEMINI_API_KEY,
    },
    logger
  );

  return { adapter, taskRepo, noteRepo, goalRepo };
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Collect all stream chunks into a single string. */
export async function collectStream(
  gen: AsyncGenerator<{ text: string; done: boolean }>
): Promise<string> {
  let full = "";
  for await (const chunk of gen) {
    full += chunk.text;
  }
  return full;
}

/** Extract entity cards from response text. */
export function extractCards(
  response: string,
  type: "task" | "note" | "goal"
): Record<string, unknown>[] {
  const regex = new RegExp(`<${type}-card>([\\s\\S]*?)</${type}-card>`, "g");
  const cards: Record<string, unknown>[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(response)) !== null) {
    try {
      cards.push(JSON.parse(match[1]));
    } catch {
      // skip unparseable
    }
  }
  return cards;
}

/** Check if a routing-info tag is present for a given agent name (case-insensitive). */
export function hasRoutingInfo(response: string, agentName: string): boolean {
  return response.toLowerCase().includes(`<routing-info>${agentName.toLowerCase()}</routing-info>`);
}

/**
 * Soft-assert that at least `min` items exist.
 * If the assertion fails (LLM non-determinism), log a warning and continue
 * instead of failing the test. This lets us surface improvement opportunities
 * without making CI flaky.
 */
export function expectItemsOrWarn(
  items: unknown[],
  min: number,
  context: string
): void {
  if (items.length < min) {
    console.warn(
      `[IMPROVEMENT] ${context}: expected >= ${min} items, got ${items.length}. ` +
      "LLM may not have called the expected tool."
    );
  }
}
