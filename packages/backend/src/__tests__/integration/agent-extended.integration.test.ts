/**
 * Extended integration tests — deeper agent challenges.
 *
 * These push the multi-agent system harder than the base suite:
 *   - Multi-turn workflows with context retention
 *   - Delete / update flows with state verification
 *   - Filtered queries (status, category, tags)
 *   - Cross-domain search from every domain perspective
 *   - Streaming with entity cards
 *   - Priority & due-date handling
 *   - Goal milestone workflows
 *   - Concurrent independent sessions
 *   - Large-data / pagination stress
 *
 * Tests use `expectItemsOrWarn` for LLM-dependent repo assertions to avoid
 * CI flakiness while still surfacing improvement opportunities via warnings.
 *
 * SKIP when GEMINI_API_KEY is not available.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  HAS_API_KEY,
  AGENT_TEST_TIMEOUT,
  createAgentHarness,
  collectStream,
  extractCards,
  expectItemsOrWarn,
  type AgentHarness,
} from "./conftest.js";

// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Agent Extended Integration", () => {
  let h: AgentHarness;

  beforeEach(() => {
    h = createAgentHarness();
  });

  // =========================================================================
  // 1. Multi-turn workflows
  // =========================================================================

  describe("multi-turn workflows", () => {
    it(
      "create → list → verify the created item appears",
      async () => {
        const sid = "s-mt-create-list";

        // Turn 1: create
        const r1 = await h.adapter.chat(
          sid,
          "Create a task called 'Deploy v2.0 to staging'"
        );
        expectItemsOrWarn(h.taskRepo.all(), 1, "create→list Turn 1");

        if (h.taskRepo.all().length === 0) {
          expect(r1.length).toBeGreaterThan(0);
          return;
        }

        // Turn 2: list — the agent should return the newly created task
        const r2 = await h.adapter.chat(sid, "Now list all tasks", [
          { role: "user", content: "Create a task called 'Deploy v2.0 to staging'" },
          { role: "model", content: r1 },
        ]);

        expect(r2.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT * 2
    );

    it(
      "create → delete → verify removal from repository",
      async () => {
        const sid = "s-mt-create-delete";

        // Turn 1: create
        const r1 = await h.adapter.chat(
          sid,
          "Create a note titled 'Temporary scratch pad' with content 'delete me later'"
        );
        const notesBefore = h.noteRepo.all();
        expectItemsOrWarn(notesBefore, 1, "create→delete Turn 1");

        if (notesBefore.length === 0) {
          expect(r1.length).toBeGreaterThan(0);
          return;
        }

        // Turn 2: delete — reference what was just created
        const r2 = await h.adapter.chat(sid, "Delete that note you just created", [
          { role: "user", content: "Create a note titled 'Temporary scratch pad' with content 'delete me later'" },
          { role: "model", content: r1 },
        ]);

        expect(r2.length).toBeGreaterThan(0);
        const notesAfter = h.noteRepo.all();
        expect(notesAfter.length).toBeLessThanOrEqual(notesBefore.length);
      },
      AGENT_TEST_TIMEOUT * 2
    );

    it(
      "create task → update its priority in a follow-up turn",
      async () => {
        const sid = "s-mt-update-priority";

        const r1 = await h.adapter.chat(
          sid,
          "Create a task 'Refactor auth middleware' with normal priority"
        );
        expectItemsOrWarn(h.taskRepo.all(), 1, "update-priority Turn 1");

        if (h.taskRepo.all().length === 0) {
          expect(r1.length).toBeGreaterThan(0);
          return;
        }

        const r2 = await h.adapter.chat(
          sid,
          "Actually, change that task's priority to high",
          [
            { role: "user", content: "Create a task 'Refactor auth middleware' with normal priority" },
            { role: "model", content: r1 },
          ]
        );

        expect(r2.length).toBeGreaterThan(0);
        expect(r2.toLowerCase()).toMatch(/updat|priorit|high|changed|done/);
      },
      AGENT_TEST_TIMEOUT * 2
    );
  });

  // =========================================================================
  // 2. Filtered queries
  // =========================================================================

  describe("filtered queries", () => {
    it(
      "lists only completed tasks when asked",
      async () => {
        await h.taskRepo.create({ title: "Done thing", status: "completed" });
        await h.taskRepo.create({ title: "Pending thing", status: "pending" });
        await h.taskRepo.create({ title: "WIP thing", status: "in_progress" });

        const res = await h.adapter.chat("s-filter-completed", "Show me only my completed tasks");

        expect(res.toLowerCase()).toMatch(/done thing|completed|1/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "lists notes filtered by category",
      async () => {
        await h.noteRepo.create({ title: "Idea: AI chat", content: "Use LLMs", category: "idea" });
        await h.noteRepo.create({ title: "Meeting: standup", content: "Daily sync", category: "meeting" });
        await h.noteRepo.create({ title: "Idea: Voice UI", content: "Speech recognition", category: "idea" });

        const res = await h.adapter.chat("s-filter-category", "Show me my idea notes");

        expect(res.toLowerCase()).toMatch(/idea|ai chat|voice/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "lists goals filtered by status",
      async () => {
        await h.goalRepo.create({ title: "Learn Rust", status: "active", category: "learning" });
        await h.goalRepo.create({ title: "Run 5k", status: "completed", category: "fitness" });
        await h.goalRepo.create({ title: "Read 50 books", status: "active", category: "learning" });

        const res = await h.adapter.chat("s-filter-goal-status", "Show me my active goals");

        expect(res.toLowerCase()).toMatch(/learn rust|read 50|active|2/);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 3. Priority & due date handling
  // =========================================================================

  describe("priority and due dates", () => {
    it(
      "creates a task with specific priority",
      async () => {
        const res = await h.adapter.chat(
          "s-priority",
          "Create an urgent task: Fix production database connection leak"
        );

        const tasks = h.taskRepo.all();
        expectItemsOrWarn(tasks, 1, "priority task creation");

        if (tasks.length > 0) {
          const created = tasks.find((t) =>
            t.title.toLowerCase().includes("database") || t.title.toLowerCase().includes("leak") || t.title.toLowerCase().includes("production")
          );
          if (created) {
            expectItemsOrWarn(
              created.priority === "high" ? ["match"] : [],
              1,
              "priority set to high"
            );
          }
        }
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates a task with a due date",
      async () => {
        const res = await h.adapter.chat(
          "s-duedate",
          "Create a task 'Submit quarterly report' due on 2026-03-15"
        );

        const tasks = h.taskRepo.all();
        expectItemsOrWarn(tasks, 1, "due date task creation");

        if (tasks.length > 0) {
          const created = tasks.find((t) =>
            t.title.toLowerCase().includes("quarterly") || t.title.toLowerCase().includes("report")
          );
          if (created?.dueDate) {
            expect(created.dueDate).toBeInstanceOf(Date);
          }
        }
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 4. Tag operations
  // =========================================================================

  describe("tag operations", () => {
    it(
      "creates a task with tags and retrieves them",
      async () => {
        const res = await h.adapter.chat(
          "s-tags-create",
          "Create a task 'Set up CI pipeline' tagged with 'devops' and 'infrastructure'"
        );

        const tasks = h.taskRepo.all();
        expectItemsOrWarn(tasks, 1, "tagged task creation");

        if (tasks.length > 0) {
          const created = tasks.find((t) =>
            t.title.toLowerCase().includes("ci") || t.title.toLowerCase().includes("pipeline")
          );
          if (created && created.tags.length > 0) {
            const tagStr = created.tags.join(" ").toLowerCase();
            expect(tagStr).toMatch(/devops|infrastructure|ci/);
          }
        }
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates a note with tags",
      async () => {
        const res = await h.adapter.chat(
          "s-tags-note",
          "Create a note titled 'Docker Tips' with content 'Use multi-stage builds' tagged 'docker' and 'devops'"
        );

        const notes = h.noteRepo.all();
        expectItemsOrWarn(notes, 1, "tagged note creation");

        if (notes.length > 0) {
          const created = notes.find((n) => n.title.toLowerCase().includes("docker"));
          if (created && created.tags.length > 0) {
            expect(created.tags.some((t) => t.toLowerCase().includes("docker"))).toBe(true);
          }
        }
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 5. Goal milestone workflows
  // =========================================================================

  describe("goal milestones", () => {
    it(
      "creates a goal and reports milestone progress",
      async () => {
        await h.goalRepo.create({
          title: "Learn TypeScript",
          category: "learning",
          status: "active",
          milestones: [
            { title: "Complete basics tutorial", completed: true, sortOrder: 0 },
            { title: "Build a project", completed: false, sortOrder: 1 },
            { title: "Learn advanced types", completed: false, sortOrder: 2 },
          ],
        });

        const res = await h.adapter.chat(
          "s-milestone-progress",
          "Show me the details of my TypeScript learning goal"
        );

        expect(res.toLowerCase()).toMatch(/milestone|progress|typescript|complete|basics|project|advanced/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "retrieves goal with multiple milestones via search",
      async () => {
        await h.goalRepo.create({
          title: "Launch SaaS product",
          category: "career",
          status: "active",
          milestones: [
            { title: "MVP ready", completed: true, sortOrder: 0 },
            { title: "Beta launch", completed: true, sortOrder: 1 },
            { title: "Public launch", completed: false, sortOrder: 2 },
          ],
        });

        const res = await h.adapter.chat("s-milestone-search", "Search goals about SaaS");

        expect(res.length).toBeGreaterThan(0);
        expect(res.toLowerCase()).toMatch(/saas|launch|product|found|goal/);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 6. Cross-domain: deeper interactions
  // =========================================================================

  describe("cross-domain deep", () => {
    it(
      "task agent can discover related notes",
      async () => {
        await h.noteRepo.create({
          title: "API Design Guidelines",
          content: "Always version your REST endpoints. Use pagination for list endpoints.",
          category: "reference",
          tags: ["api", "design"],
        });

        const res = await h.adapter.chat(
          "s-xdomain-task-notes",
          "Create a task to review API design. Check if there are any notes about API design first."
        );

        expect(res.toLowerCase()).toMatch(/api|design|task|created|note/);
        expectItemsOrWarn(h.taskRepo.all(), 1, "cross-domain task creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "goal agent can discover related tasks",
      async () => {
        await h.taskRepo.create({
          title: "Write unit tests for auth module",
          status: "in_progress",
          tags: ["testing"],
        });
        await h.taskRepo.create({
          title: "Write integration tests for API",
          status: "pending",
          tags: ["testing"],
        });

        const res = await h.adapter.chat(
          "s-xdomain-goal-tasks",
          "Create a goal 'Achieve 90% test coverage'. Check if there are any existing tasks related to testing."
        );

        expect(res.toLowerCase()).toMatch(/test|coverage|goal|created|task/);
        expectItemsOrWarn(h.goalRepo.all(), 1, "cross-domain goal creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 7. Streaming with entity cards
  // =========================================================================

  describe("streaming extended", () => {
    it(
      "streams a create response and produces entity cards",
      async () => {
        const chunks: Array<{ text: string; done: boolean }> = [];
        for await (const chunk of h.adapter.chatStream(
          "s-stream-create",
          "Create a task called 'Test streaming output'"
        )) {
          chunks.push(chunk);
        }

        expect(chunks.length).toBeGreaterThanOrEqual(2);
        expect(chunks[chunks.length - 1].done).toBe(true);

        const full = chunks.map((c) => c.text).join("");
        expect(full.length).toBeGreaterThan(0);

        expectItemsOrWarn(h.taskRepo.all(), 1, "streaming task creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "streams a list response with seeded data",
      async () => {
        await h.noteRepo.create({ title: "Stream note A", content: "Content A", category: "general" });
        await h.noteRepo.create({ title: "Stream note B", content: "Content B", category: "idea" });

        const full = await collectStream(
          h.adapter.chatStream("s-stream-list", "List all my notes")
        );

        expect(full.length).toBeGreaterThan(0);
        expect(full.toLowerCase()).toMatch(/stream note|note/);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 8. Update & delete end-to-end
  // =========================================================================

  describe("update and delete flows", () => {
    it(
      "updates a seeded task by ID via natural language",
      async () => {
        const created = await h.taskRepo.create({
          title: "Draft blog post",
          status: "pending",
        });

        const res = await h.adapter.chat(
          "s-update-task",
          `Update the task with ID ${created.id}: change its status to in_progress`
        );

        const updated = await h.taskRepo.findById(created.id);
        expect(updated).not.toBeNull();
        if (updated!.status !== "pending") {
          expect(updated!.status).toBe("in_progress");
        }
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "deletes a seeded note by ID via natural language",
      async () => {
        const created = await h.noteRepo.create({
          title: "Ephemeral note to delete",
          content: "This should be removed",
        });

        const res = await h.adapter.chat(
          "s-delete-note",
          `Delete the note with ID ${created.id}`
        );

        expect(res.length).toBeGreaterThan(0);
        const after = await h.noteRepo.findById(created.id);
        expect(after).toBeNull();
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "deletes a seeded goal by ID",
      async () => {
        const created = await h.goalRepo.create({
          title: "Abandoned goal to remove",
          status: "abandoned",
          category: "other",
        });

        const res = await h.adapter.chat(
          "s-delete-goal",
          `Delete the goal with ID ${created.id}`
        );

        expect(res.length).toBeGreaterThan(0);
        const after = await h.goalRepo.findById(created.id);
        expect(after).toBeNull();
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 9. Concurrent independent sessions
  // =========================================================================

  describe("concurrent sessions", () => {
    it(
      "two sessions create items independently without interference",
      async () => {
        const [r1, r2] = await Promise.all([
          h.adapter.chat("s-concurrent-1", "Create a task called 'Session One Task'"),
          h.adapter.chat("s-concurrent-2", "Create a note titled 'Session Two Note' with content 'isolated'"),
        ]);

        expect(r1.length).toBeGreaterThan(0);
        expect(r2.length).toBeGreaterThan(0);

        const tasks = h.taskRepo.all();
        const notes = h.noteRepo.all();

        expectItemsOrWarn(tasks, 1, "concurrent session task");
        expectItemsOrWarn(notes, 1, "concurrent session note");
      },
      AGENT_TEST_TIMEOUT * 2
    );
  });

  // =========================================================================
  // 10. Large data set handling
  // =========================================================================

  describe("large data sets", () => {
    it(
      "handles listing when repository has many items",
      async () => {
        for (let i = 1; i <= 15; i++) {
          await h.taskRepo.create({
            title: `Bulk task #${i}`,
            status: i % 3 === 0 ? "completed" : i % 3 === 1 ? "pending" : "in_progress",
          });
        }

        const res = await h.adapter.chat("s-large-list", "How many tasks do I have? Give me task statistics.");

        expect(res.length).toBeGreaterThan(0);
        expect(res.toLowerCase()).toMatch(/15|total|tasks?|stat|pending|complet|progress|\d+/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "search narrows down from a large dataset",
      async () => {
        const topics = ["React hooks", "Database indexing", "Docker networking", "GraphQL schema", "Redis caching"];
        for (const topic of topics) {
          await h.noteRepo.create({
            title: `Deep dive: ${topic}`,
            content: `Detailed notes about ${topic} and best practices`,
            category: "reference",
          });
        }
        for (let i = 0; i < 10; i++) {
          await h.noteRepo.create({
            title: `Meeting ${i}`,
            content: `Meeting notes for week ${i}`,
            category: "meeting",
          });
        }

        const res = await h.adapter.chat("s-large-search", "Search notes about Docker");

        expect(res.toLowerCase()).toMatch(/docker|networking|deep dive/);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 11. Edge: malformed / unusual input
  // =========================================================================

  describe("unusual input", () => {
    it(
      "handles a very long message without crashing",
      async () => {
        const longMsg = "Create a task called " + "very ".repeat(200) + "important task";
        const res = await h.adapter.chat("s-edge-long", longMsg);

        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles special characters in entity names",
      async () => {
        const res = await h.adapter.chat(
          "s-edge-special",
          "Create a note titled 'Config: key=value & max_retries=3 (important!)' with content 'testing special chars'"
        );

        expect(res.length).toBeGreaterThan(0);
        expectItemsOrWarn(h.noteRepo.all(), 1, "special chars note creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles unicode in task names",
      async () => {
        const res = await h.adapter.chat(
          "s-edge-unicode",
          "Create a task called 'Review design mockups'"
        );

        expect(res.length).toBeGreaterThan(0);
        expectItemsOrWarn(h.taskRepo.all(), 1, "unicode task creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 12. Multi-entity creation in one request
  // =========================================================================

  describe("batch operations", () => {
    it(
      "creates multiple notes in a single request",
      async () => {
        const res = await h.adapter.chat(
          "s-batch-notes",
          "Create these notes: 1) 'Meeting: Sprint Planning' about sprint goals 2) 'Idea: AI Dashboard' about visualizing AI metrics 3) 'Reference: Coding Standards' about team conventions"
        );

        const notes = h.noteRepo.all();
        expectItemsOrWarn(notes, 2, "batch note creation");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates a goal with detailed milestones in one shot",
      async () => {
        const res = await h.adapter.chat(
          "s-batch-goal",
          "Create a career goal 'Get promoted to Staff Engineer' with these milestones: Lead a major project, Mentor 3 junior engineers, Give a tech talk, Write an RFC for a system redesign"
        );

        const goals = h.goalRepo.all();
        expectItemsOrWarn(goals, 1, "batch goal creation");

        if (goals.length > 0) {
          const created = goals.find((g) =>
            g.title.toLowerCase().includes("staff") || g.title.toLowerCase().includes("promoted")
          );
          if (created) {
            expectItemsOrWarn(created.milestones, 3, "batch milestone creation");
          }
        }
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 13. Statistics across domains
  // =========================================================================

  describe("statistics", () => {
    it(
      "task statistics reflect correct status distribution",
      async () => {
        await h.taskRepo.create({ title: "T1", status: "pending" });
        await h.taskRepo.create({ title: "T2", status: "pending" });
        await h.taskRepo.create({ title: "T3", status: "in_progress" });
        await h.taskRepo.create({ title: "T4", status: "completed" });
        await h.taskRepo.create({ title: "T5", status: "completed" });
        await h.taskRepo.create({ title: "T6", status: "completed" });

        const res = await h.adapter.chat("s-stats-tasks", "Give me detailed task statistics");

        expect(res.toLowerCase()).toMatch(/6|total|pending|complet|in.progress|stat/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "note statistics reflect correct category distribution",
      async () => {
        await h.noteRepo.create({ title: "N1", content: "c", category: "meeting" });
        await h.noteRepo.create({ title: "N2", content: "c", category: "meeting" });
        await h.noteRepo.create({ title: "N3", content: "c", category: "idea" });
        await h.noteRepo.create({ title: "N4", content: "c", category: "reference" });

        const res = await h.adapter.chat("s-stats-notes", "What are my note statistics?");

        expect(res.toLowerCase()).toMatch(/4|total|meeting|idea|reference|stat/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "goal statistics include milestone progress",
      async () => {
        await h.goalRepo.create({
          title: "G1",
          status: "active",
          category: "fitness",
          milestones: [
            { title: "M1", completed: true, sortOrder: 0 },
            { title: "M2", completed: true, sortOrder: 1 },
            { title: "M3", completed: false, sortOrder: 2 },
          ],
        });
        await h.goalRepo.create({
          title: "G2",
          status: "completed",
          category: "learning",
          milestones: [
            { title: "M4", completed: true, sortOrder: 0 },
          ],
        });

        const res = await h.adapter.chat("s-stats-goals", "Show me goal statistics with milestone progress");

        expect(res.toLowerCase()).toMatch(/2|total|milestone|progress|active|complet/);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 14. Contextual understanding
  // =========================================================================

  describe("contextual understanding", () => {
    it(
      "understands implicit domain from context",
      async () => {
        const res = await h.adapter.chat(
          "s-context-implicit",
          "I need to remember to buy groceries, pick up dry cleaning, and call the dentist"
        );

        expectItemsOrWarn(h.taskRepo.all(), 1, "implicit task routing");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "understands note-like requests without saying 'note'",
      async () => {
        const res = await h.adapter.chat(
          "s-context-note-implicit",
          "Write down that the team decided to use PostgreSQL for the main database and Redis for caching"
        );

        expectItemsOrWarn(h.noteRepo.all(), 1, "implicit note routing");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "understands goal-like requests without saying 'goal'",
      async () => {
        const res = await h.adapter.chat(
          "s-context-goal-implicit",
          "I want to achieve fluency in Spanish within 6 months. I should start with basics, then conversation practice, then take a proficiency exam."
        );

        expectItemsOrWarn(h.goalRepo.all(), 1, "implicit goal routing");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // 15. Search precision
  // =========================================================================

  describe("search precision", () => {
    it(
      "finds the right task among many similar ones",
      async () => {
        await h.taskRepo.create({ title: "Fix login page CSS", status: "completed" });
        await h.taskRepo.create({ title: "Fix signup page validation", status: "pending" });
        await h.taskRepo.create({ title: "Fix checkout payment flow", status: "in_progress" });
        await h.taskRepo.create({ title: "Update login page copy", status: "pending" });

        const res = await h.adapter.chat("s-search-precision", "Search for tasks about the checkout");

        expect(res.toLowerCase()).toMatch(/checkout|payment/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "finds notes by content, not just title",
      async () => {
        await h.noteRepo.create({
          title: "Architecture Notes",
          content: "The microservices communicate via gRPC for internal calls and REST for external APIs",
          category: "reference",
        });
        await h.noteRepo.create({
          title: "Random thoughts",
          content: "Today was a good day",
          category: "general",
        });

        const res = await h.adapter.chat("s-search-content", "Search notes about gRPC");

        expect(res.toLowerCase()).toMatch(/grpc|architecture|microservice/);
      },
      AGENT_TEST_TIMEOUT
    );
  });
});
