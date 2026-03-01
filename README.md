# Agent CRUD

**A full-stack app where AI agents are a first-class interface and orchestrated by a router agent.**

Users manage tasks, notes, and goals through Kanban boards, forms, and search **or** by chatting with specialized AI agents that understand their data. Both interfaces share the same domain logic, validation, and data layer.

This project explores a different approach: **a router-and-delegate architecture where each domain has its own specialized agent with scoped tools, isolated mutation rights, and a purpose-built system prompt.**

```
You: "Add a task to buy groceries, high priority, due friday"
TaskAgent: Created task "Buy groceries" — priority high, due 2026-03-07.

You: "What should I focus on today?"
TaskAgent: You have 3 pending tasks. I'd prioritize "Fix login bug" (high, overdue)...

You: "Create a fitness goal to run a 5K, with weekly milestones"
GoalAgent: Created goal "Run a 5K" with 4 milestones. First up: Week 1 — Run 1K.
```

---

## Why Multi-Agent — And Why It Matters

- **Focused context windows** — Each agent only sees tools and instructions relevant to its domain. A TaskAgent never sees goal-related tools, so it can't hallucinate milestone operations.
- **Intent-based routing, not keyword matching** — The Router Agent classifies what the user wants to *do*, not what words they used. "Note to self: buy milk" routes to NoteAgent (record information). "My goal is to buy groceries" routes to TaskAgent (it's a to-do, not a life goal).
- **Cross-domain awareness without cross-domain mutation** — Each agent can *read* across all domains for context ("find tasks related to my fitness goal"), but can only *write* to its own. This prevents a single misrouted request from corrupting unrelated data.
- **Clean separation of concerns** — Adding a new domain (e.g., Habits) means creating a new agent, tools, and prompt — no changes to existing agents. The router picks it up automatically via its sub-agent descriptions.

---

## Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   User message                                          │
│       │                                                 │
│       ▼                                                 │
│   ┌─────────────────────────────────────┐               │
│   │         Router Agent (LLM)          │               │
│   │                                     │               │
│   │  • Classifies user intent           │               │
│   │  • Prioritizes action over keywords │               │
│   │  • Handles ambiguity, negation,     │               │
│   │    follow-ups, multi-domain reqs    │               │
│   │  • Delegates — never refuses        │               │
│   └──────┬──────────┬──────────┬────────┘               │
│          │          │          │                        │
│   ┌──────▼───┐ ┌────▼─────┐ ┌──▼───────┐                │
│   │TaskAgent │ │NoteAgent │ │GoalAgent │                │
│   │          │ │          │ │          │                │
│   │ 8 tools  │ │ 8 tools  │ │ 8 tools  │                │
│   │ +4 cross │ │ +4 cross │ │ +4 cross │                │
│   └──────┬───┘ └────┬─────┘ └──┬───────┘                │
│          │          │          │                        │
│   ┌──────▼──────────▼──────────▼───────────┐            │
│   │         Domain Services                │            │
│   │   TaskService · NoteService · GoalSvc  │            │
│   └──────────────────┬─────────────────────┘            │
│                      │                                  │
│   ┌──────────────────▼─────────────────────┐            │
│   │      Drizzle ORM → PostgreSQL 16       │            │
│   └────────────────────────────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### How Routing Works

The Router Agent uses an **intent-over-keywords decision tree** with explicit rules for ambiguous cases:

| User says | Routed to | Why |
|-----------|-----------|-----|
| "Add a task to buy milk" | TaskAgent | Direct task creation |
| "Note to self: buy milk" | NoteAgent | Idiom — means "record this information" |
| "My goal is to finish the report" | TaskAgent | Colloquial "goal" — actually a to-do |
| "I want to get better at running" | GoalAgent | Long-term aspiration |
| "Translate that to Spanish" | *Previous agent* | Follow-up — applies to last action |
| "Create a task AND a note about it" | TaskAgent | Primary domain; uses cross-domain tools for the note |
| "Don't create a task, just make a note" | NoteAgent | Negation — routes to the *wanted* domain |

The router never refuses. When intent is ambiguous, it delegates to its best guess rather than asking clarifying questions — because the worst case is a polite response from the wrong agent, not a dead end.

### Agent Tool System

Each domain agent has **8 core tools** plus **4 cross-domain tools** (32 tools system-wide):

**Core tools per agent:**
| Tool | Description |
|------|-------------|
| `list_{domain}` | List items with optional filters (status, category, tags) |
| `get_{domain}_by_id` | Retrieve a specific item |
| `search_{domain}` | Full-text search across title/description/content |
| `get_{domain}_statistics` | Aggregated stats (counts, breakdowns, completion rates) |
| `create_{domain}` | Create with full field support |
| `update_{domain}` | Partial update any field |
| `delete_{domain}` | Delete by ID |
| *domain-specific* | `bulk_update_tasks`, `get_all_tags`, `toggle_milestone` |

**Cross-domain tools** (per agent):
| Tool | Permission |
|------|-----------|
| `search_other_{domain}` | Read-only — find related items in other domains |
| `create_other_{domain}` | Write — handle compound requests ("create a task AND a note") |

Tools are thin wrappers around domain repository methods, wrapped with `safeExecute` for graceful error handling. All business logic lives in the domain layer.

### Streaming & Entity Cards

Chat responses stream over WebSocket via the Google ADK event system:

```
ADK Event Stream → Extract text chunks → Extract entity cards → Yield to frontend
```

When an agent creates or modifies data, the tool response is parsed into a **structured entity card** (task-card, note-card, goal-card) and rendered inline in the conversation. Users see exactly what changed — title, status, priority, milestones — without leaving the chat.

A **routing badge** is also injected before the first text chunk so the UI can show which agent handled the request.

### Observability

Every chat interaction is traced with **Langfuse** — input, output, agent routing, latency. Traces flush asynchronously with a 3-second timeout so observability never blocks the response. Langfuse is optional; the system runs fine without it.

---

### Why tRPC

End-to-end type safety without codegen. Zod schemas validate at every boundary. The frontend knows at compile time exactly what the backend accepts and returns.

---

## Features

**AI Chat**
- Multi-agent system with intent-based routing
- Streaming responses over WebSocket
- Cross-domain awareness with scoped mutation rights
- Inline entity cards for created/modified items
- Persistent conversation history with auto-generated titles
- Conversation summarization for long chats

**CRUD & UI**
- Kanban boards organized by status/category per domain
- Full search, filter, and sort across all domains
- Goal tracking with nested milestones and progress bars
- Keyboard shortcuts — `Cmd+K` (search), `Cmd+N` (new), `g+t/n/w` (navigate)
- Mobile-responsive with adaptive sidebar and drawer panels

**Demo Mode**
- Built-in automated demo that showcases the full agent system
- Click "Demo Mode" in the bottom-right of the chat page to start
- Runs 12 sequential prompts: CRUD, goals with milestones, cross-domain queries, batch operations, search, and conversational intelligence
- Auto-scrolls and highlights the affected entity card in the side panel after each action
- Pause, resume, skip, or stop at any time

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker
- [Google Gemini API key](https://aistudio.google.com/apikey)

### Setup

```bash
git clone https://github.com/your-username/agent-crud.git && cd agent-crud
pnpm install

# Configure environment
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start PostgreSQL, run migrations, launch dev servers
pnpm infra:up
pnpm db:migrate
pnpm dev
```

The app will be running at [http://localhost:5173](http://localhost:5173).

```bash
pnpm db:seed    # Optional: populate with sample data
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start backend (3000) + frontend (5173) |
| `pnpm build` | Build both packages |
| `pnpm infra:up` | Start PostgreSQL via Docker |
| `pnpm infra:down` | Stop PostgreSQL |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:generate` | Generate migrations from schema changes |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:reset` | Drop all tables and recreate schema from scratch |
| `pnpm format` | Sort imports across codebase (via Biome) |
| `pnpm format:check` | Check import sorting without modifying (for CI) |

---

## License

MIT
