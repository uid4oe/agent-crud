import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import postgres from "postgres";
import { goals, milestones, notes, tasks } from "./schema.js";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000);

async function seed() {
  const sql = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(sql);

  console.log("Seeding database...\n");

  // --- Tasks (12 items, spread across statuses for a full Kanban) ---
  const taskRows = await db
    .insert(tasks)
    .values([
      // Pending (5)
      {
        title: "Prepare Q1 demo presentation",
        description: "Build slides showcasing the AI multi-agent chat, Kanban boards, and cross-domain features.",
        status: "pending",
        priority: "high",
        dueDate: daysFromNow(2),
        tags: ["work", "presentation"],
      },
      {
        title: "Write unit tests for auth module",
        description: "Cover login, logout, token refresh, and session expiry flows. Target 90% coverage.",
        status: "pending",
        priority: "normal",
        dueDate: daysFromNow(5),
        tags: ["engineering", "testing"],
      },
      {
        title: "Send March invoice to Acme Corp",
        description: "Monthly consulting invoice — 40 hours at agreed rate. Include expense receipts.",
        status: "pending",
        priority: "high",
        dueDate: daysFromNow(3),
        tags: ["finance", "client"],
      },
      {
        title: "Plan team offsite agenda",
        description: "Draft agenda for the April team offsite: icebreakers, retrospective, roadmap planning.",
        status: "pending",
        priority: "normal",
        dueDate: daysFromNow(14),
        tags: ["work", "team"],
      },
      {
        title: "Update project README",
        description: "Add setup instructions, environment variables, API docs, and contribution guidelines.",
        status: "pending",
        priority: "low",
        dueDate: daysFromNow(7),
        tags: ["docs", "engineering"],
      },

      // In Progress (4)
      {
        title: "Review Q1 OKR progress",
        description: "Go through each team OKR and update progress percentages before Friday standup.",
        status: "in_progress",
        priority: "high",
        dueDate: daysAgo(1),
        tags: ["work", "okrs"],
      },
      {
        title: "Fix login redirect bug",
        description: "Users are redirected to /dashboard instead of their last visited page after login.",
        status: "in_progress",
        priority: "high",
        dueDate: daysFromNow(1),
        tags: ["engineering", "bug"],
      },
      {
        title: "Deploy v2.3 to staging",
        description: "Run migration, deploy backend and frontend, smoke test the streaming chat feature.",
        status: "in_progress",
        priority: "high",
        dueDate: daysFromNow(0),
        tags: ["engineering", "deploy"],
      },
      {
        title: "Design review — onboarding flow",
        description: "Iterate on the new user onboarding screens based on last week's feedback session.",
        status: "in_progress",
        priority: "normal",
        dueDate: daysFromNow(2),
        tags: ["design", "ux"],
      },

      // Completed (3)
      {
        title: "Set up CI/CD pipeline",
        description: "GitHub Actions workflow for lint, test, build, and deploy to staging on merge.",
        status: "completed",
        priority: "high",
        tags: ["engineering", "devops"],
        createdAt: daysAgo(7),
      },
      {
        title: "Grocery shopping",
        description: "Milk, eggs, bread, vegetables, chicken, rice.",
        status: "completed",
        priority: "normal",
        dueDate: daysAgo(2),
        tags: ["personal"],
        createdAt: daysAgo(3),
      },
      {
        title: "Book dentist appointment",
        description: "Six-month checkup scheduled with Dr. Patel — March 15 at 10am.",
        status: "completed",
        priority: "low",
        tags: ["personal", "health"],
        createdAt: daysAgo(5),
      },
    ])
    .returning({ id: tasks.id, title: tasks.title });

  console.log(`  ✓ ${taskRows.length} tasks`);

  // --- Notes (8 items, covering all 5 categories) ---
  const noteRows = await db
    .insert(notes)
    .values([
      // General
      {
        title: "Project architecture decisions",
        content: "Went with clean architecture (hexagonal) for the backend:\n\n- Domain layer has zero external dependencies\n- Repository pattern behind port interfaces\n- tRPC for type-safe API layer\n- Drizzle ORM for database access\n\nThis makes it easy to swap infrastructure without touching business logic.",
        category: "general",
        tags: ["architecture", "engineering"],
      },

      // Ideas (2)
      {
        title: "AI-powered daily standup bot",
        content: "Build a Slack bot that:\n1. Collects async standups from each team member\n2. Generates a summary using LLMs\n3. Identifies blockers and suggests who can help\n4. Tracks trends (recurring blockers, velocity changes)\n\nCould integrate with Linear/Jira for automatic status pulls.",
        category: "idea",
        tags: ["project-idea", "ai", "slack"],
      },
      {
        title: "Habit tracker mobile app",
        content: "Personal habit tracking with streak visualization, weekly summaries, and push reminders. Stack: React Native + Supabase. Could integrate with Apple Health for automatic check-ins.\n\nMVP features: daily check-in, streak counter, simple analytics.",
        category: "idea",
        tags: ["project-idea", "mobile"],
      },

      // Reference (2)
      {
        title: "Useful PostgreSQL queries",
        content: "-- Slow query analysis\nSELECT query, mean_time, calls\nFROM pg_stat_statements\nORDER BY mean_time DESC LIMIT 10;\n\n-- Table sizes\nSELECT relname, pg_size_pretty(pg_total_relation_size(relid))\nFROM pg_catalog.pg_statio_user_tables\nORDER BY pg_total_relation_size(relid) DESC;\n\n-- Active connections\nSELECT * FROM pg_stat_activity WHERE state = 'active';",
        category: "reference",
        tags: ["postgres", "sql", "devops"],
      },
      {
        title: "API rate limiting strategy",
        content: "Options evaluated:\n1. Fixed window — simple but allows bursts\n2. Sliding window — smoother, more memory\n3. Token bucket — best for variable-cost endpoints\n\nDecision: sliding window via Redis. Tiers:\n- Free: 100 req/min\n- Pro: 1,000 req/min\n\nImplement as Express middleware with X-RateLimit-* response headers.",
        category: "reference",
        tags: ["architecture", "api", "engineering"],
      },

      // Meeting
      {
        title: "Sprint planning — March 1",
        content: "Attendees: Sarah, Mike, Jess, Carlos\n\nSprint goal: Ship streaming chat + entity panel MVP\n\nCommitted stories:\n- Streaming responses (8 pts) — Carlos\n- Entity panel desktop (5 pts) — Jess\n- Entity panel mobile drawer (3 pts) — Jess\n- Fix auth redirect bug (2 pts) — Mike\n- Unit tests for auth (3 pts) — Sarah\n\nCapacity: 21 pts, committed 21 pts ✓\n\nAction items:\n- Sarah: finalize test plan by Tuesday\n- Mike: update the API docs after auth fix\n- Carlos: pair with Jess on panel integration",
        category: "meeting",
        tags: ["sprint", "planning", "engineering"],
      },

      // Personal (2)
      {
        title: "Weekly reflection — Feb 24",
        content: "What went well:\n- Shipped the chat streaming feature on time\n- Great feedback from beta users on the Kanban boards\n\nWhat to improve:\n- Spent too long on CSS micro-adjustments — timebox styling work to 1hr\n- Need to delegate more code reviews to the team\n\nGoals for next week:\n- Finish auth module tests\n- Start planning the team offsite",
        category: "personal",
        tags: ["reflection", "weekly"],
      },
      {
        title: "Books to read in 2026",
        content: "- Designing Data-Intensive Applications (Martin Kleppmann)\n- The Staff Engineer's Path (Tanya Reilly)\n- Thinking in Systems (Donella Meadows)\n- Never Split the Difference (Chris Voss)\n- Four Thousand Weeks (Oliver Burkeman)\n- Build (Tony Fadell)\n- An Elegant Puzzle (Will Larson)",
        category: "personal",
        tags: ["reading", "books"],
      },
    ])
    .returning({ id: notes.id, title: notes.title });

  console.log(`  ✓ ${noteRows.length} notes`);

  // --- Goals with milestones (6 goals, mix of active/completed/categories) ---
  const goalRows = await db
    .insert(goals)
    .values([
      {
        title: "Run a half marathon",
        description: "Train consistently and complete a 21K race by summer. Currently running 5K comfortably.",
        status: "active",
        category: "fitness",
        targetDate: daysFromNow(120),
      },
      {
        title: "Read 12 books this year",
        description: "One book per month — mix of technical, business, and fiction.",
        status: "active",
        category: "other",
        targetDate: new Date("2026-12-31"),
      },
      {
        title: "Launch side project MVP",
        description: "Ship the habit tracker app to the App Store with core features: daily check-ins, streaks, and basic analytics.",
        status: "active",
        category: "other",
        targetDate: daysFromNow(60),
      },
      {
        title: "Meditate daily for 30 days",
        description: "Build a consistent morning meditation practice, 10 minutes minimum. Using Headspace.",
        status: "active",
        category: "mindfulness",
        targetDate: daysFromNow(30),
      },
      {
        title: "Cook 3 new recipes per week",
        description: "Expand my cooking repertoire and eat healthier. Focus on meal prep for work lunches.",
        status: "active",
        category: "nutrition",
        targetDate: daysFromNow(60),
      },
      {
        title: "Improve sleep schedule",
        description: "Consistently sleep by 11 PM and wake by 7 AM. No screens after 10 PM.",
        status: "completed",
        category: "sleep",
        targetDate: daysAgo(10),
      },
    ])
    .returning({ id: goals.id, title: goals.title });

  console.log(`  ✓ ${goalRows.length} goals`);

  const goalMap = Object.fromEntries(goalRows.map((g) => [g.title, g.id]));

  const milestoneRows = await db
    .insert(milestones)
    .values([
      // Run a half marathon (2/5 done — visible progress)
      { goalId: goalMap["Run a half marathon"], title: "Run 5K without stopping", completed: true, sortOrder: 0 },
      { goalId: goalMap["Run a half marathon"], title: "Run 10K under 60 minutes", completed: true, sortOrder: 1 },
      { goalId: goalMap["Run a half marathon"], title: "Run 15K comfortably", completed: false, sortOrder: 2 },
      { goalId: goalMap["Run a half marathon"], title: "Complete a practice 21K", completed: false, sortOrder: 3 },
      { goalId: goalMap["Run a half marathon"], title: "Race day — finish under 2:15", completed: false, sortOrder: 4 },

      // Read 12 books (3/6 shown)
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 1 — Jan", completed: true, sortOrder: 0 },
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 2 — Feb", completed: true, sortOrder: 1 },
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 3 — Mar", completed: true, sortOrder: 2 },
      { goalId: goalMap["Read 12 books this year"], title: "Reach halfway — Jun", completed: false, sortOrder: 3 },
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 9 — Sep", completed: false, sortOrder: 4 },
      { goalId: goalMap["Read 12 books this year"], title: "Complete all 12 — Dec", completed: false, sortOrder: 5 },

      // Launch side project (1/5 done)
      { goalId: goalMap["Launch side project MVP"], title: "Finalize wireframes & design", completed: true, sortOrder: 0 },
      { goalId: goalMap["Launch side project MVP"], title: "Build core tracking UI", completed: false, sortOrder: 1 },
      { goalId: goalMap["Launch side project MVP"], title: "Implement backend API", completed: false, sortOrder: 2 },
      { goalId: goalMap["Launch side project MVP"], title: "Beta test with 5 users", completed: false, sortOrder: 3 },
      { goalId: goalMap["Launch side project MVP"], title: "Submit to App Store", completed: false, sortOrder: 4 },

      // Meditate daily (1/3 done)
      { goalId: goalMap["Meditate daily for 30 days"], title: "Complete first 7-day streak", completed: true, sortOrder: 0 },
      { goalId: goalMap["Meditate daily for 30 days"], title: "Complete 14-day streak", completed: false, sortOrder: 1 },
      { goalId: goalMap["Meditate daily for 30 days"], title: "Complete full 30 days", completed: false, sortOrder: 2 },

      // Cook 3 recipes (1/3 done)
      { goalId: goalMap["Cook 3 new recipes per week"], title: "Try 10 new recipes", completed: true, sortOrder: 0 },
      { goalId: goalMap["Cook 3 new recipes per week"], title: "Master 5 go-to meals", completed: false, sortOrder: 1 },
      { goalId: goalMap["Cook 3 new recipes per week"], title: "Meal prep consistently for a month", completed: false, sortOrder: 2 },

      // Improve sleep (all done — completed goal)
      { goalId: goalMap["Improve sleep schedule"], title: "Set consistent 7 AM alarm", completed: true, sortOrder: 0 },
      { goalId: goalMap["Improve sleep schedule"], title: "No screens after 10 PM for 1 week", completed: true, sortOrder: 1 },
      { goalId: goalMap["Improve sleep schedule"], title: "Maintain schedule for 2 weeks", completed: true, sortOrder: 2 },
    ])
    .returning({ id: milestones.id });

  console.log(`  ✓ ${milestoneRows.length} milestones`);

  await sql.end();
  console.log("\n✅ Seed completed!\n");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
