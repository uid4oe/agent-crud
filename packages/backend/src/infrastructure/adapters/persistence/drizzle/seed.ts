import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import { tasks, notes, goals, milestones } from "./schema.js";

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

  console.log("Seeding database...");

  // --- Tasks ---
  const taskRows = await db
    .insert(tasks)
    .values([
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
        title: "Prepare design review slides",
        description: "Create presentation for the new onboarding flow redesign.",
        status: "pending",
        priority: "normal",
        dueDate: daysFromNow(2),
        tags: ["design", "presentation"],
      },
      {
        title: "Update project README",
        description: "Add setup instructions, environment variables, and contribution guidelines.",
        status: "pending",
        priority: "low",
        dueDate: daysFromNow(7),
        tags: ["docs"],
      },
      {
        title: "Write unit tests for auth module",
        description: "Cover login, logout, token refresh, and session expiry flows.",
        status: "pending",
        priority: "normal",
        dueDate: daysFromNow(5),
        tags: ["engineering", "testing"],
      },
      {
        title: "Send invoice to client",
        description: "March invoice for the consulting engagement with Acme Corp.",
        status: "pending",
        priority: "high",
        dueDate: daysFromNow(3),
        tags: ["finance", "client"],
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
        description: "Schedule six-month checkup. Dr. Patel's office.",
        status: "completed",
        priority: "low",
        tags: ["personal", "health"],
        createdAt: daysAgo(5),
      },
      {
        title: "Deploy v2.3 to staging",
        description: "Run migration, deploy backend and frontend, smoke test the chat feature.",
        status: "in_progress",
        priority: "high",
        dueDate: daysFromNow(0),
        tags: ["engineering", "deploy"],
      },
      {
        title: "Plan team offsite agenda",
        description: "Draft agenda for the April team offsite: icebreakers, retro, roadmap session.",
        status: "pending",
        priority: "normal",
        dueDate: daysFromNow(14),
        tags: ["work", "team"],
      },
    ])
    .returning({ id: tasks.id, title: tasks.title });

  console.log(`  ✓ Inserted ${taskRows.length} tasks`);

  // --- Notes ---
  const noteRows = await db
    .insert(notes)
    .values([
      {
        title: "Habit tracker app idea",
        content:
          "Build a personal habit tracking dashboard with streak visualization, weekly summaries, and push reminders. Stack: React Native + Supabase. Could integrate with Apple Health for automatic check-ins.",
        category: "idea",
        tags: ["project-idea", "mobile"],
      },
      {
        title: "Design review — March 1",
        content:
          "Attendees: Sarah, Mike, Jess\n\nDiscussed:\n- New onboarding flow (approved with minor tweaks)\n- Color palette update for dark mode\n- Icon consistency across platforms\n\nAction items:\n- Sarah: finalize illustrations by Wed\n- Mike: update component library tokens\n- Jess: user-test the revised flow with 5 participants",
        category: "meeting",
        tags: ["design", "meeting-notes"],
      },
      {
        title: "Useful PostgreSQL queries",
        content:
          "-- Find slow queries\nSELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;\n\n-- Table sizes\nSELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;\n\n-- Active connections\nSELECT * FROM pg_stat_activity WHERE state = 'active';",
        category: "reference",
        tags: ["postgres", "sql", "devops"],
      },
      {
        title: "Weekly reflection — Feb 24",
        content:
          "What went well:\n- Shipped the chat streaming feature on time\n- Great feedback from beta users\n\nWhat to improve:\n- Spent too long on CSS tweaks — timebox styling work\n- Need to delegate more to the team\n\nGoals for next week:\n- Finish auth module tests\n- Start planning the team offsite",
        category: "personal",
        tags: ["reflection", "weekly"],
      },
      {
        title: "API rate limiting strategy",
        content:
          "Options considered:\n1. Fixed window — simple but bursty\n2. Sliding window — smoother but more memory\n3. Token bucket — best for APIs with varying cost\n\nDecision: go with sliding window using Redis. 100 req/min for free tier, 1000 req/min for pro. Implement via middleware with X-RateLimit-* headers.",
        category: "reference",
        tags: ["architecture", "api", "engineering"],
      },
      {
        title: "Books to read",
        content:
          "- Designing Data-Intensive Applications (Martin Kleppmann)\n- The Staff Engineer's Path (Tanya Reilly)\n- Thinking in Systems (Donella Meadows)\n- Never Split the Difference (Chris Voss)\n- Four Thousand Weeks (Oliver Burkeman)",
        category: "personal",
        tags: ["reading", "books"],
      },
    ])
    .returning({ id: notes.id, title: notes.title });

  console.log(`  ✓ Inserted ${noteRows.length} notes`);

  // --- Goals with milestones ---
  const goalRows = await db
    .insert(goals)
    .values([
      {
        title: "Run a 5K",
        description: "Train consistently and complete a 5K run under 30 minutes by June.",
        status: "active",
        category: "fitness",
        targetDate: daysFromNow(90),
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
        description: "Ship the habit tracker app to the App Store with core features.",
        status: "active",
        category: "other",
        targetDate: daysFromNow(60),
      },
      {
        title: "Meditate daily for 30 days",
        description: "Build a consistent morning meditation practice, 10 minutes minimum.",
        status: "active",
        category: "mindfulness",
        targetDate: daysFromNow(30),
      },
      {
        title: "Improve sleep schedule",
        description: "Consistently sleep by 11 PM and wake by 7 AM for better energy.",
        status: "completed",
        category: "sleep",
        targetDate: daysAgo(10),
      },
    ])
    .returning({ id: goals.id, title: goals.title });

  console.log(`  ✓ Inserted ${goalRows.length} goals`);

  const goalMap = Object.fromEntries(goalRows.map((g) => [g.title, g.id]));

  const milestoneRows = await db
    .insert(milestones)
    .values([
      // Run a 5K
      { goalId: goalMap["Run a 5K"], title: "Run 1K without stopping", completed: true, sortOrder: 0 },
      { goalId: goalMap["Run a 5K"], title: "Run 2.5K under 18 minutes", completed: true, sortOrder: 1 },
      { goalId: goalMap["Run a 5K"], title: "Run 5K (any pace)", completed: false, sortOrder: 2 },
      { goalId: goalMap["Run a 5K"], title: "Run 5K under 30 minutes", completed: false, sortOrder: 3 },

      // Read 12 books
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 1 (Jan)", completed: true, sortOrder: 0 },
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 2 (Feb)", completed: true, sortOrder: 1 },
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 3 (Mar)", completed: false, sortOrder: 2 },
      { goalId: goalMap["Read 12 books this year"], title: "Finish book 6 (Jun) — halfway", completed: false, sortOrder: 3 },

      // Launch side project
      { goalId: goalMap["Launch side project MVP"], title: "Finalize wireframes", completed: true, sortOrder: 0 },
      { goalId: goalMap["Launch side project MVP"], title: "Build core tracking UI", completed: false, sortOrder: 1 },
      { goalId: goalMap["Launch side project MVP"], title: "Implement backend API", completed: false, sortOrder: 2 },
      { goalId: goalMap["Launch side project MVP"], title: "Beta test with 5 users", completed: false, sortOrder: 3 },
      { goalId: goalMap["Launch side project MVP"], title: "Submit to App Store", completed: false, sortOrder: 4 },

      // Meditate daily
      { goalId: goalMap["Meditate daily for 30 days"], title: "Complete first 7-day streak", completed: true, sortOrder: 0 },
      { goalId: goalMap["Meditate daily for 30 days"], title: "Complete 14-day streak", completed: false, sortOrder: 1 },
      { goalId: goalMap["Meditate daily for 30 days"], title: "Complete full 30 days", completed: false, sortOrder: 2 },

      // Improve sleep (completed goal)
      { goalId: goalMap["Improve sleep schedule"], title: "Set consistent alarm for 7 AM", completed: true, sortOrder: 0 },
      { goalId: goalMap["Improve sleep schedule"], title: "No screens after 10 PM for a week", completed: true, sortOrder: 1 },
      { goalId: goalMap["Improve sleep schedule"], title: "Maintain schedule for 2 weeks", completed: true, sortOrder: 2 },
    ])
    .returning({ id: milestones.id });

  console.log(`  ✓ Inserted ${milestoneRows.length} milestones`);

  await sql.end();
  console.log("\nSeed completed successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
