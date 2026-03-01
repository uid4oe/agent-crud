# Agent CRUD App

A full-stack productivity app where you manage tasks, notes, and goals through a traditional UI **or** by chatting with AI agents that understand your data.

> **The idea:** What if your to-do app had a team of AI assistants that could create, update, search, and analyze your items — and everything stayed in sync between the chat and the UI?

## How It Works

```
You: "Add a task to buy groceries, high priority, due friday"
TaskAgent: Created task "Buy groceries" with priority high, due 2026-03-06.

You: "What should I focus on today?"
TaskAgent: You have 3 pending tasks. I'd prioritize "Fix login bug" (high, overdue)...

You: "Create a note with my meeting takeaways: discussed Q2 roadmap..."
NoteAgent: Created note "Meeting Takeaways" in the meeting category.
```

Meanwhile, everything the agents create or modify appears instantly in the Kanban boards and CRUD interfaces.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite + Tailwind)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Chat UI  │  │  Kanban  │  │  Forms   │          │
│  │ Stream   │  │  Boards  │  │  (CRUD)  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       └──────────────┼─────────────┘                │
│                      │ tRPC (end-to-end type safe)  │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────┐
│  Backend (Express + tRPC + Clean Architecture)      │
│                      │                              │
│  ┌───────────────────┴────────────────────┐         │
│  │           Router Agent (LLM)           │         │
│  │   "Which agent handles this request?"  │         │
│  └──────┬──────────┬──────────┬───────────┘         │
│         │          │          │                      │
│  ┌──────┴───┐ ┌────┴─────┐ ┌─┴──────────┐          │
│  │TaskAgent │ │NoteAgent │ │ GoalAgent  │          │
│  │ 8 tools  │ │ 8 tools  │ │ 10+ tools  │          │
│  └──────┬───┘ └────┬─────┘ └─┬──────────┘          │
│         │          │          │                      │
│  ┌──────┴──────────┴──────────┴───────────┐         │
│  │         Domain Services (pure)         │         │
│  │   TaskService  NoteService  GoalService│         │
│  └──────────────────┬─────────────────────┘         │
│                     │                               │
│  ┌──────────────────┴─────────────────────┐         │
│  │   Drizzle ORM  →  PostgreSQL 16        │         │
│  └────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

## Key Design Decisions

**Clean Architecture (Hexagonal)** — The domain layer has zero external dependencies. Services depend on repository interfaces (ports), not database implementations. This means the AI agents and the REST API use the exact same business logic.

**Multi-Agent System** — Instead of one monolithic chatbot, a Router Agent delegates to domain-specialized agents (Task, Note, Goal). Each agent has purpose-built tools and can only mutate its own domain, but can read across domains for context.

**End-to-End Type Safety** — Zod schemas validate at every boundary. tRPC infers types from backend to frontend at compile time. No codegen, no runtime surprises.

**Entity Cards** — When an AI agent creates or modifies data, it returns structured entity cards that the frontend renders inline in the chat. Users see what changed without leaving the conversation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS, React Router 7 |
| State | TanStack Query + tRPC (server), Context (UI) |
| Forms | React Hook Form + Zod |
| API | tRPC v11 (type-safe RPC over HTTP + WebSocket) |
| Backend | Express.js, TypeScript (strict) |
| Database | PostgreSQL 16 + Drizzle ORM |
| AI | Google Gemini 2.0 Flash via @google/adk |
| Observability | Langfuse (self-hosted LLM tracing) |
| Monorepo | pnpm workspaces |

## Features

- **Dual interaction model** — Manage data via Kanban boards/forms or AI chat
- **Streaming responses** — Real-time WebSocket streaming for AI conversations
- **Domain agents** — Specialized AI agents for tasks, notes, and goals
- **Cross-domain awareness** — Agents can reference data across domains
- **Conversation history** — Persistent chat with rename, search, and delete
- **Kanban boards** — Visual organization per domain (by status/category)
- **Search, filter, sort** — Full filtering across all domains
- **Keyboard shortcuts** — Cmd+K (search), Cmd+N (new), g+t/n/w (navigate)
- **Mobile responsive** — Adaptive sidebar, drawer panels
- **Milestone tracking** — Goals with nested milestones and progress calculation

## Project Structure

```
packages/
  backend/
    src/
      domain/              # Pure business logic (no external deps)
        task/              #   Entity, Service, Repository Port
        note/              #   Entity, Service, Repository Port
        goal/              #   Entity, Service, Repository Port, Milestones
        conversation/      #   Chat + Message management
        shared/            #   Errors, types, AI port interfaces
      infrastructure/      # External concerns
        adapters/
          persistence/     #   Drizzle ORM repositories
          ai/              #   Multi-agent system (router, agents, tools)
          observability/   #   Langfuse tracing
        config/            #   DI container, Zod-validated config
        endpoints/         #   tRPC routers
        middleware/        #   Error handling, rate limiting, logging

  frontend/
    src/
      components/          # Chat, Tasks, Notes, Goals, UI primitives
      hooks/               # useChat, useTasks, useNotes, useGoals
      pages/               # Lazy-loaded route pages
      lib/                 # tRPC client, Zod schemas, utilities
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for PostgreSQL)
- [Google Gemini API key](https://aistudio.google.com/apikey)

### Setup

```bash
# Clone and install
git clone <repo-url> && cd agent-crud-app
pnpm install

# Configure environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

# Start infrastructure and run
pnpm infra:up          # PostgreSQL via Docker
pnpm db:migrate        # Run migrations
pnpm dev               # Backend (3000) + Frontend (5173)
```

Open [http://localhost:5173](http://localhost:5173) and start chatting.

### Testing

```bash
pnpm --filter backend test        # Run domain service tests
pnpm --filter backend test:watch  # Watch mode
```

## What This Demonstrates

This project is a proof-of-concept exploring how AI agents can be integrated into CRUD applications as first-class interaction patterns — not as a bolted-on chatbot, but as an alternative interface that shares the same domain logic, validation, and data layer as the traditional UI.

---

Built with TypeScript, clean architecture, and a lot of coffee.
