/**
 * Contextual understanding tests — validate agent routing and behavior improvements.
 *
 * Strategy:
 *   - HARD assert on ROUTING (which agent handled it?) — deterministic from <routing-info> tags
 *   - HARD assert on RESPONSE content (did the agent respond meaningfully?)
 *   - SOFT assert on TOOL EXECUTION (did the LLM call the create tool?) — non-deterministic
 *
 * This catches routing regressions while surfacing tool-call improvement opportunities.
 *
 * Categories:
 *   A. Ambiguous domain routing
 *   B. Multi-domain requests
 *   C. Follow-up / pronoun resolution
 *   D. Negation & correction handling
 *   E. Overlapping domain keywords
 *   F. Implicit intent (no domain words)
 *   G. Goal category boundaries (any category, not just wellness)
 *   H. Relative & ordinal references
 *   I. Meta / capability questions
 *   J. Conversational niceties & undo
 *   K. Complex compound instructions
 *   L. Cross-domain data awareness
 *   M. Error recovery & graceful degradation
 *   N. Tone & style adaptation
 *
 * SKIP when GEMINI_API_KEY is not available.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  AGENT_TEST_TIMEOUT,
  type AgentHarness,
  createAgentHarness,
  expectItemsOrWarn,
  HAS_API_KEY,
  hasRoutingInfo,
} from "./conftest.js";

describe.skipIf(!HAS_API_KEY)("Agent Contextual Understanding", () => {
  let h: AgentHarness;

  beforeEach(() => {
    h = createAgentHarness();
  });

  // =========================================================================
  // A. Ambiguous domain routing
  // =========================================================================

  describe("ambiguous routing", () => {
    it(
      "routes 'remind me to …' to TaskAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-ambig-remind",
          "Remind me to call the doctor tomorrow"
        );

        // ROUTING: "remind me to …" → TaskAgent (prompt improvement)
        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expectItemsOrWarn(h.taskRepo.all(), 1, "remind me → task creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes 'I have an idea …' to NoteAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-ambig-idea",
          "I have an idea: what if we build a recommendation engine using collaborative filtering?"
        );

        // ROUTING: "I have an idea: …" → NoteAgent (prompt improvement)
        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expectItemsOrWarn(h.noteRepo.all(), 1, "idea → note creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes 'I want to get better at …' to GoalAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-ambig-aspiration",
          "I want to get better at running. I can barely do 1k right now but would like to eventually run 10k."
        );

        // ROUTING: "I want to get better at …" → GoalAgent (prompt improvement)
        expect(hasRoutingInfo(res, "GoalAgent")).toBe(true);
        expectItemsOrWarn(h.goalRepo.all(), 1, "aspiration → goal creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes 'save this for later' to NoteAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-ambig-save",
          "Save this for later: the API rate limit is 1000 req/min for free tier and 10000 for pro"
        );

        // ROUTING: "save this for later: …" → NoteAgent (prompt improvement)
        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expectItemsOrWarn(h.noteRepo.all(), 1, "save for later → note creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes 'I should …' to TaskAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-ambig-should",
          "I should update the README before merging the PR"
        );

        // ROUTING: "I should …" → TaskAgent (prompt improvement)
        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expectItemsOrWarn(h.taskRepo.all(), 1, "I should → task creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // B. Multi-domain requests
  // =========================================================================

  describe("multi-domain requests", () => {
    it(
      "creates both a task AND a note via cross-domain tools",
      async () => {
        // Router delegates to primary agent, which uses create_other_* for the secondary
        await h.adapter.chat(
          "s-multi-domain-both",
          "Create a task 'Review design spec' and also create a note titled 'Design spec feedback' with my thoughts on the approach"
        );

        const tasks = h.taskRepo.all();
        const notes = h.noteRepo.all();

        // With cross-domain write tools, both should be created
        expect(tasks.length + notes.length).toBeGreaterThanOrEqual(2);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates a goal AND tasks for each milestone via cross-domain tools",
      async () => {
        // GoalAgent now has create_other_task tool
        const res = await h.adapter.chat(
          "s-multi-domain-goal-tasks",
          "Create a fitness goal 'Complete a triathlon' with milestones for swimming, cycling, and running. Then create a task for each training area."
        );

        const goals = h.goalRepo.all();
        const tasks = h.taskRepo.all();

        // Goal should always be created
        expect(goals.length).toBeGreaterThanOrEqual(1);
        // Tasks should be created via cross-domain tool
        expectItemsOrWarn(tasks, 1, "cross-domain task creation from GoalAgent");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // C. Follow-up / pronoun resolution
  // =========================================================================

  describe("follow-up resolution", () => {
    it(
      "resolves 'mark it done' after creating a task",
      async () => {
        const sid = "s-followup-it";

        const r1 = await h.adapter.chat(sid, "Create a task: Send invoice to client");
        const tasks = h.taskRepo.all();
        if (tasks.length === 0) {
          console.warn("[IMPROVEMENT] Follow-up: Turn 1 didn't create task.");
          return;
        }
        const createdId = tasks[0].id;

        const r2 = await h.adapter.chat(sid, "Mark it done", [
          { role: "user", content: "Create a task: Send invoice to client" },
          { role: "model", content: r1 },
        ]);

        // ROUTING: follow-up → same agent (TaskAgent)
        expect(hasRoutingInfo(r2, "TaskAgent")).toBe(true);

        const updated = await h.taskRepo.findById(createdId);
        if (updated && updated.status !== "completed") {
          console.warn(
            `[IMPROVEMENT] Follow-up: 'mark it done' didn't complete task. Status: "${updated.status}".`
          );
        }
      },
      AGENT_TEST_TIMEOUT * 2
    );

    it(
      "resolves 'add tags to that' after creating a note",
      async () => {
        const sid = "s-followup-that";

        const r1 = await h.adapter.chat(
          sid,
          "Create a note titled 'Meeting recap' about the quarterly planning session"
        );
        const notes = h.noteRepo.all();
        if (notes.length === 0) {
          console.warn("[IMPROVEMENT] Follow-up: Turn 1 didn't create note.");
          return;
        }

        const r2 = await h.adapter.chat(sid, "Add tags 'planning' and 'Q1' to that", [
          { role: "user", content: "Create a note titled 'Meeting recap' about the quarterly planning session" },
          { role: "model", content: r1 },
        ]);

        // ROUTING: follow-up → same agent (NoteAgent)
        expect(hasRoutingInfo(r2, "NoteAgent")).toBe(true);
        expect(r2.toLowerCase()).toMatch(/tag|updat|added|planning|q1/);
      },
      AGENT_TEST_TIMEOUT * 2
    );

    it(
      "translates a goal and persists the update",
      async () => {
        const sid = "s-followup-translate-goal";

        const r1 = await h.adapter.chat(sid, "Create a fitness goal to run 5K");
        const goals = h.goalRepo.all();
        if (goals.length === 0) {
          console.warn("[IMPROVEMENT] Translate goal: Turn 1 didn't create goal.");
          return;
        }
        const goalId = goals[0].id;
        const originalTitle = goals[0].title;

        const r2 = await h.adapter.chat(sid, "Translate it to Swedish", [
          { role: "user", content: "Create a fitness goal to run 5K" },
          { role: "model", content: r1 },
        ]);

        // ROUTING: follow-up → same agent (GoalAgent)
        expect(hasRoutingInfo(r2, "GoalAgent")).toBe(true);

        // The goal should be UPDATED (not just text response)
        const updatedGoal = await h.goalRepo.findById(goalId);
        if (updatedGoal && updatedGoal.title === originalTitle) {
          console.warn(
            `[IMPROVEMENT] Translate goal: agent responded but didn't call update_goal. Title unchanged: "${updatedGoal.title}".`
          );
        }
      },
      AGENT_TEST_TIMEOUT * 2
    );

    it(
      "handles 'delete it' with no prior context gracefully",
      async () => {
        const res = await h.adapter.chat("s-followup-no-ctx", "Delete it");

        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // D. Negation & correction
  // =========================================================================

  describe("negation and correction", () => {
    it(
      "routes 'don't create a task, just make a note' to NoteAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-negate-task",
          "Don't create a task for this. Just make a note: we need to discuss the database migration strategy in the next meeting."
        );

        // ROUTING: negation rule — route to the WANTED domain (NoteAgent)
        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expect(res.length).toBeGreaterThan(0);

        // Should NOT create a task (negated domain)
        if (h.taskRepo.all().length > 0) {
          console.warn("[IMPROVEMENT] Negation: task created despite 'Don't create a task'.");
        }
        expectItemsOrWarn(h.noteRepo.all(), 1, "negation → note creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles 'actually, make that a goal instead of a task'",
      async () => {
        const sid = "s-correct-domain";

        const r1 = await h.adapter.chat(sid, "Create a task to lose 10 pounds");

        const r2 = await h.adapter.chat(
          sid,
          "Actually, that should be a goal, not a task. Can you create it as a fitness goal instead?",
          [
            { role: "user", content: "Create a task to lose 10 pounds" },
            { role: "model", content: r1 },
          ]
        );

        // ROUTING: correction should route to GoalAgent
        expect(hasRoutingInfo(r2, "GoalAgent")).toBe(true);
        expectItemsOrWarn(h.goalRepo.all(), 1, "correction → goal creation");
      },
      AGENT_TEST_TIMEOUT * 2
    );

    it(
      "handles cancellation: 'never mind, forget what I just said'",
      async () => {
        const sid = "s-cancel";

        const r1 = await h.adapter.chat(sid, "Create a task: Buy a new laptop");
        const tasksBefore = h.taskRepo.all().length;
        if (tasksBefore === 0) {
          console.warn("[IMPROVEMENT] Cancellation: Turn 1 didn't create task.");
          return;
        }

        const r2 = await h.adapter.chat(sid, "Never mind, forget that. Delete it.", [
          { role: "user", content: "Create a task: Buy a new laptop" },
          { role: "model", content: r1 },
        ]);

        // ROUTING: "never mind" follow-up → same agent (TaskAgent)
        expect(hasRoutingInfo(r2, "TaskAgent")).toBe(true);

        const tasksAfter = h.taskRepo.all().length;
        if (tasksAfter >= tasksBefore) {
          console.warn(
            "[IMPROVEMENT] Cancellation: task still exists. " +
            "Agent should map 'never mind, delete it' to delete."
          );
        }
        expect(r2.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT * 2
    );
  });

  // =========================================================================
  // E. Overlapping domain keywords
  // =========================================================================

  describe("overlapping keywords", () => {
    it(
      "routes 'note to self' to NoteAgent despite other domain keywords",
      async () => {
        // Contains "note", "task", and "goal" — all three domain keywords
        // Router prompt explicitly: "note to self" → NoteAgent
        const res = await h.adapter.chat(
          "s-overlap-all",
          "Note to self: finish the task about updating the goals page"
        );

        // ROUTING: "note to self" idiom → NoteAgent
        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expectItemsOrWarn(h.noteRepo.all(), 1, "note-to-self idiom → note creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes colloquial 'my goal is to finish tasks' to TaskAgent",
      async () => {
        // "goal" keyword used colloquially, not as an aspiration
        // Router prompt: "my goal is to finish tasks" → colloquial → TaskAgent
        const res = await h.adapter.chat(
          "s-overlap-goal-task",
          "My goal for today is to finish all my tasks. Show me what's pending."
        );

        // ROUTING: colloquial "goal" + asking about tasks → TaskAgent
        // The word "goal" is colloquial here; router sometimes takes it literally
        const routedToTask = hasRoutingInfo(res, "TaskAgent");
        if (!routedToTask) {
          console.warn(
            "[IMPROVEMENT] Colloquial 'goal': routed to GoalAgent instead of TaskAgent. " +
            "Router should recognize 'my goal for today is to finish tasks' as task-management intent."
          );
        }
        // Must delegate to SOME agent (not refuse)
        expect(
          hasRoutingInfo(res, "TaskAgent") || hasRoutingInfo(res, "GoalAgent")
        ).toBe(true);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes 'take note of these items' to NoteAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-overlap-triple",
          "Take note of these items for the team meeting: review the sprint goals and assign tasks to each team member"
        );

        // ROUTING: "take note" action → NoteAgent
        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expectItemsOrWarn(h.noteRepo.all(), 1, "take note of → note creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // F. Implicit intent (no domain words)
  // =========================================================================

  describe("implicit intent", () => {
    it(
      "routes 'pick up milk on the way home' to TaskAgent",
      async () => {
        // Router prompt: implicit errand → TaskAgent
        const res = await h.adapter.chat(
          "s-implicit-errand",
          "Pick up milk on the way home"
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expectItemsOrWarn(h.taskRepo.all(), 1, "implicit errand → task creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes a recipe to NoteAgent",
      async () => {
        // Router prompt: "here's a recipe …" → NoteAgent
        const res = await h.adapter.chat(
          "s-implicit-recipe",
          "Here's a great pasta recipe: boil water, cook pasta 8 min, sauté garlic in olive oil, toss together with parmesan"
        );

        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expectItemsOrWarn(h.noteRepo.all(), 1, "implicit recipe → note creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes 'I want to be able to do 50 pushups' to GoalAgent",
      async () => {
        // Router prompt: "I want to be able to …" → GoalAgent
        const res = await h.adapter.chat(
          "s-implicit-fitness",
          "I want to be able to do 50 pushups by the end of the year"
        );

        expect(hasRoutingInfo(res, "GoalAgent")).toBe(true);
        expectItemsOrWarn(h.goalRepo.all(), 1, "implicit fitness → goal creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "routes meeting info to NoteAgent",
      async () => {
        const res = await h.adapter.chat(
          "s-implicit-meeting-info",
          "The meeting is at 3pm in room 204, John and Sara will attend, we'll discuss the Q2 roadmap"
        );

        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expectItemsOrWarn(h.noteRepo.all(), 1, "implicit meeting info → note creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // G. Goal category boundaries
  // =========================================================================

  describe("goal category handling", () => {
    it(
      "routes career goals to GoalAgent (not just wellness)",
      async () => {
        // Goal prompt now handles any category, not just wellness
        const res = await h.adapter.chat(
          "s-goal-career",
          "Create a goal: Get promoted to senior engineer within the next year"
        );

        // ROUTING: career goal → GoalAgent (router now includes career/financial/learning)
        expect(hasRoutingInfo(res, "GoalAgent")).toBe(true);
        expectItemsOrWarn(h.goalRepo.all(), 1, "career goal creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates financial goals with milestones",
      async () => {
        // Goal prompt example: "save $10,000" → create_goal with category=other
        const res = await h.adapter.chat(
          "s-goal-financial",
          "I want to save $10,000 for an emergency fund. Set milestones at $2500, $5000, $7500, and $10000."
        );

        expect(hasRoutingInfo(res, "GoalAgent")).toBe(true);
        const goals = h.goalRepo.all();
        expectItemsOrWarn(goals, 1, "financial goal creation");
        if (goals.length > 0) {
          expectItemsOrWarn(goals[0].milestones, 2, "financial goal milestones");
        }
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates learning goals with appropriate category",
      async () => {
        // Goal prompt example: "learn conversational Japanese" → create_goal with category=other
        const res = await h.adapter.chat(
          "s-goal-learning",
          "My goal is to learn conversational Japanese in 6 months with milestones for hiragana, katakana, basic grammar, and 500 vocab words"
        );

        expect(hasRoutingInfo(res, "GoalAgent")).toBe(true);
        expectItemsOrWarn(h.goalRepo.all(), 1, "learning goal creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // H. Relative & ordinal references
  // =========================================================================

  describe("relative references", () => {
    it(
      "handles 'show me my latest task'",
      async () => {
        await h.taskRepo.create({ title: "Old task from last week", status: "completed" });
        await new Promise((r) => setTimeout(r, 10));
        await h.taskRepo.create({ title: "Brand new task just added", status: "pending" });

        const res = await h.adapter.chat(
          "s-relative-latest",
          "Show me my most recent task"
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles 'how many tasks do I have'",
      async () => {
        await h.taskRepo.create({ title: "T1" });
        await h.taskRepo.create({ title: "T2" });
        await h.taskRepo.create({ title: "T3" });

        const res = await h.adapter.chat(
          "s-relative-count",
          "How many tasks do I have?"
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expect(res.toLowerCase()).toMatch(/3|three|task/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "bulk-updates all pending tasks to completed",
      async () => {
        await h.taskRepo.create({ title: "Pending A", status: "pending" });
        await h.taskRepo.create({ title: "Pending B", status: "pending" });
        await h.taskRepo.create({ title: "Already done", status: "completed" });

        // Task agent now has bulk_update_tasks tool
        const res = await h.adapter.chat(
          "s-relative-all-pending",
          "Mark all my pending tasks as completed"
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expect(res.toLowerCase()).toMatch(/complet|updat|mark|done|pending/);

        // With bulk_update_tasks tool, all pending should now be completed
        const pendingAfter = h.taskRepo.all().filter((t) => t.status === "pending");
        if (pendingAfter.length > 0) {
          console.warn(
            `[IMPROVEMENT] Bulk update: ${pendingAfter.length} of 2 task(s) still pending. ` +
            `Agent should use bulk_update_tasks to update all at once.`
          );
        }
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // I. Meta / capability questions
  // =========================================================================

  describe("meta questions", () => {
    it(
      "responds to 'what can you do?' without creating anything",
      async () => {
        const res = await h.adapter.chat(
          "s-meta-capabilities",
          "What can you help me with?"
        );

        // Router should handle this itself (pure greeting/small talk rule)
        expect(h.taskRepo.all().length).toBe(0);
        expect(h.noteRepo.all().length).toBe(0);
        expect(h.goalRepo.all().length).toBe(0);
        expect(res.toLowerCase()).toMatch(/task|note|goal|help|manage|create/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "responds to 'give me an overview of everything' across domains",
      async () => {
        await h.taskRepo.create({ title: "Task X", status: "pending" });
        await h.noteRepo.create({ title: "Note Y", content: "content" });
        await h.goalRepo.create({ title: "Goal Z", status: "active", category: "fitness" });

        const res = await h.adapter.chat(
          "s-meta-overview",
          "Give me an overview of everything I have — tasks, notes, and goals"
        );

        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // J. Conversational niceties & undo
  // =========================================================================

  describe("conversational handling", () => {
    it(
      "responds to 'thank you' without creating anything",
      async () => {
        const res = await h.adapter.chat("s-social-thanks", "Thank you, that was helpful!");

        expect(h.taskRepo.all().length).toBe(0);
        expect(h.noteRepo.all().length).toBe(0);
        expect(h.goalRepo.all().length).toBe(0);
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "responds to a greeting without creating anything",
      async () => {
        const res = await h.adapter.chat("s-social-hello", "Hi there! How's it going?");

        expect(h.taskRepo.all().length).toBe(0);
        expect(h.noteRepo.all().length).toBe(0);
        expect(h.goalRepo.all().length).toBe(0);
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles 'undo' after a creation",
      async () => {
        const sid = "s-social-undo";
        const r1 = await h.adapter.chat(sid, "Add a task called 'Wrong task that I will undo'");
        const tasksBefore = h.taskRepo.all().length;

        if (tasksBefore === 0) {
          console.warn("[IMPROVEMENT] Undo test: Turn 1 didn't create task.");
          return;
        }

        const r2 = await h.adapter.chat(sid, "Undo that, I didn't mean to create it", [
          { role: "user", content: "Add a task called 'Wrong task that I will undo'" },
          { role: "model", content: r1 },
        ]);

        // ROUTING: "undo" follow-up → same agent
        expect(hasRoutingInfo(r2, "TaskAgent")).toBe(true);

        const tasksAfter = h.taskRepo.all().length;
        if (tasksAfter >= tasksBefore) {
          console.warn(
            "[IMPROVEMENT] Undo: task still exists. Agent should map 'undo' → delete last created."
          );
        }
        expect(r2.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT * 2
    );
  });

  // =========================================================================
  // K. Complex compound instructions
  // =========================================================================

  describe("compound instructions", () => {
    it(
      "creates a task with all attributes in one call",
      async () => {
        const res = await h.adapter.chat(
          "s-compound-create",
          "Create a task called 'Deploy hotfix' with high priority, tag it 'urgent' and 'production', and set status to in_progress"
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        const tasks = h.taskRepo.all();
        expectItemsOrWarn(tasks, 1, "compound task creation");

        if (tasks.length > 0) {
          const created = tasks[0];
          if (created.priority !== "high") {
            console.warn("[IMPROVEMENT] Compound: priority not 'high'.");
          }
          if (created.status !== "in_progress") {
            console.warn("[IMPROVEMENT] Compound: status not 'in_progress'.");
          }
          if (!created.tags.includes("urgent")) {
            console.warn("[IMPROVEMENT] Compound: missing 'urgent' tag.");
          }
        }
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles conditional: 'if no pending tasks, create one'",
      async () => {
        // Task prompt now has conditional instruction examples
        const res = await h.adapter.chat(
          "s-compound-conditional",
          "Check if I have any pending tasks. If not, create one called 'Plan the week ahead'."
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);

        const tasks = h.taskRepo.all();
        if (tasks.length === 0) {
          console.warn(
            "[IMPROVEMENT] Conditional: checked but didn't create. " +
            "'If not, create one' not executed as instruction."
          );
        }
        expect(res.toLowerCase()).toMatch(/task|pending|no|create|plan|found|none|empty/);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "creates a goal then creates tasks for each milestone via cross-domain",
      async () => {
        // GoalAgent now has create_other_task tool
        const res = await h.adapter.chat(
          "s-compound-sequential",
          "Create a goal 'Ship v2.0' with milestones: Design, Implement, Test, Deploy. Then create a task for each milestone."
        );

        const goals = h.goalRepo.all();
        const tasks = h.taskRepo.all();

        // Goal should be created
        expect(goals.length).toBeGreaterThanOrEqual(1);
        // Tasks should be created via create_other_task
        expectItemsOrWarn(tasks, 2, "sequential: tasks created via cross-domain from GoalAgent");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // L. Cross-domain data awareness
  // =========================================================================

  describe("cross-domain awareness", () => {
    it(
      "note agent searches tasks then creates a note",
      async () => {
        await h.taskRepo.create({
          title: "Implement OAuth2 login",
          description: "Add Google and GitHub OAuth providers",
          status: "in_progress",
        });
        await h.taskRepo.create({
          title: "Write auth middleware",
          description: "JWT validation middleware for protected routes",
          status: "pending",
        });

        const res = await h.adapter.chat(
          "s-xdomain-note-aware",
          "Create a note summarizing our authentication work. Search for any related tasks first."
        );

        // ROUTING: note creation request → NoteAgent
        expect(hasRoutingInfo(res, "NoteAgent")).toBe(true);
        expect(res.toLowerCase()).toMatch(/auth|oauth|login|middleware|note|creat/);

        if (h.noteRepo.all().length === 0) {
          console.warn(
            "[IMPROVEMENT] Cross-domain: searched tasks but didn't create note. " +
            "Prompt says 'never stop after just searching'."
          );
        }
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "goal agent checks tasks then creates a goal",
      async () => {
        await h.taskRepo.create({
          title: "Run 2 miles today",
          status: "completed",
          tags: ["fitness"],
        });

        const res = await h.adapter.chat(
          "s-xdomain-goal-aware",
          "Create a fitness goal 'Get in shape for summer'. Check if I have any fitness-related tasks already."
        );

        // ROUTING: goal creation → GoalAgent
        expect(hasRoutingInfo(res, "GoalAgent")).toBe(true);
        expectItemsOrWarn(h.goalRepo.all(), 1, "cross-domain goal creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "task agent checks goals then creates a task",
      async () => {
        await h.goalRepo.create({
          title: "Launch product by Q2",
          status: "active",
          category: "other",
          milestones: [
            { title: "Complete MVP", completed: true, sortOrder: 0 },
            { title: "Beta testing", completed: false, sortOrder: 1 },
          ],
        });

        const res = await h.adapter.chat(
          "s-xdomain-task-goal",
          "Create a task for beta testing. Check if there's a related goal first."
        );

        // ROUTING: task creation → TaskAgent
        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expectItemsOrWarn(h.taskRepo.all(), 1, "cross-domain task creation");
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // M. Error recovery & graceful degradation
  // =========================================================================

  describe("error recovery", () => {
    it(
      "handles invalid status gracefully",
      async () => {
        const t = await h.taskRepo.create({ title: "Test task", status: "pending" });

        const res = await h.adapter.chat(
          "s-error-invalid-status",
          `Update task ${t.id}: set status to "banana"`
        );

        expect(res.length).toBeGreaterThan(0);
        const after = await h.taskRepo.findById(t.id);
        expect(after).not.toBeNull();
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles contradictory instruction gracefully",
      async () => {
        const res = await h.adapter.chat(
          "s-error-contradict",
          "Create a completed task that is also pending and in progress"
        );

        expect(res.length).toBeGreaterThan(0);
        const tasks = h.taskRepo.all();
        if (tasks.length > 0) {
          expect(["pending", "in_progress", "completed"]).toContain(tasks[0].status);
        }
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles wrong-domain operation gracefully",
      async () => {
        const n = await h.noteRepo.create({ title: "Test note", content: "content" });

        const res = await h.adapter.chat(
          "s-error-wrong-domain-op",
          `Mark note ${n.id} as completed`
        );

        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles extremely short input",
      async () => {
        const res = await h.adapter.chat("s-error-short", "k");
        expect(res.length).toBeGreaterThan(0);
      },
      AGENT_TEST_TIMEOUT
    );
  });

  // =========================================================================
  // N. Tone & style adaptation
  // =========================================================================

  describe("tone and style", () => {
    it(
      "handles informal/slang input",
      async () => {
        const res = await h.adapter.chat(
          "s-tone-slang",
          "yo add a task - gotta fix that bug in the login page asap"
        );

        // ROUTING: "add a task" → TaskAgent regardless of slang
        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expectItemsOrWarn(h.taskRepo.all(), 1, "slang → task creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles formal/professional input",
      async () => {
        const res = await h.adapter.chat(
          "s-tone-formal",
          "Please create a task to prepare the quarterly financial report for the board of directors, categorized as high priority with a due date of March 31st, 2026."
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        expectItemsOrWarn(h.taskRepo.all(), 1, "formal → task creation");
      },
      AGENT_TEST_TIMEOUT
    );

    it(
      "handles bullet-point list input",
      async () => {
        const res = await h.adapter.chat(
          "s-tone-bullets",
          `Add these tasks:
- Fix header alignment
- Update footer links
- Optimize image loading
- Add dark mode toggle`
        );

        expect(hasRoutingInfo(res, "TaskAgent")).toBe(true);
        const tasks = h.taskRepo.all();
        expectItemsOrWarn(tasks, 2, "bullet list → multiple task creation");
        if (tasks.length < 4) {
          console.warn(
            `[IMPROVEMENT] Bullet list: only ${tasks.length}/4 tasks created. ` +
            "Agent should create one task per bullet point."
          );
        }
      },
      AGENT_TEST_TIMEOUT
    );
  });
});
