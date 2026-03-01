# CLAUDE.md — Operational Guide for Claude Code

This file gives Claude everything it needs to develop agent-crud-app without re-investigating the codebase.

## Agent Development Team

This project has a full team of specialized AI agents you can invoke via slash commands. Each agent has deep context about this codebase, its architecture, and conventions.

### Available Agents

| Command | Role | When to Use |
|---------|------|-------------|
| `/team [task]` | **Tech Lead / Orchestrator** | Complex multi-step tasks — decomposes and delegates |
| `/plan [feature]` | **Technical Planner** | Generate detailed specs before implementation |
| `/architect [question]` | **System Architect** | Design decisions, new domains, schema changes |
| `/backend [task]` | **Backend Developer** | Express, tRPC, Drizzle, domain logic, repositories |
| `/frontend [task]` | **Frontend Developer** | React components, hooks, pages, Tailwind, forms |
| `/agent-ai [task]` | **AI Systems Specialist** | Domain agents, ADK tools, prompts, router |
| `/reviewer [files]` | **Code Reviewer** | 7-dimension code review |
| `/tester [module]` | **Test Engineer** | Vitest setup, unit/integration tests |
| `/devops [task]` | **DevOps Engineer** | Docker, CI/CD, monorepo tooling |

### Workflow Examples

```bash
# Simple backend fix:
/backend Fix the 500 error when creating a note without tags

# New domain (full team):
/team Add a "Habits" domain with daily tracking, streaks, and AI agent support

# Code review:
/reviewer Review the goal domain implementation across both packages

# AI enhancement:
/agent-ai Improve the router agent to handle multi-domain requests

# Planning:
/plan Add real-time collaboration with WebSocket support
```

### Team Orchestration

For complex tasks, `/team` follows: **Plan → Build → Test → Review → Verify**

## Project Overview

Full-stack monorepo: task/note/goal management app with AI-powered multi-agent chat. Users manage items via CRUD UI or by chatting with specialized AI agents.

## Quick Reference

```
Structure:  pnpm monorepo (packages/backend + packages/frontend)
Runtime:    Node.js 20+ (ESM, .js extensions in imports)
Package:    pnpm workspaces
Language:   TypeScript (strict mode)
Backend:    Express.js + tRPC v11 + Drizzle ORM
Database:   PostgreSQL 16
AI:         Google Gemini 2.0 Flash via @google/adk
Observability: Langfuse
Frontend:   React 19 + Vite 7 + Tailwind + CVA + React Router + TanStack Query
Forms:      React Hook Form + Zod
State:      tRPC + React Query (server) / Context (global UI) / useState (local)
```

## Starting the Project

```bash
pnpm install          # Install all workspace dependencies
pnpm infra:up         # Start PostgreSQL via Docker
pnpm db:migrate       # Run Drizzle migrations
pnpm dev              # Start backend (3000) + frontend (5173)
```

## Environment Variables

Required in `.env` (root):
```env
DATABASE_URL=postgres://user:pass@localhost:5432/agent_crud
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash
```

Optional:
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
LOG_FORMAT=pretty
RATE_LIMIT_ENABLED=true
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_BASE_URL=http://localhost:3001
```

## Key Commands

```bash
# Development
pnpm dev                          # Both packages in parallel
pnpm --filter backend dev         # Backend only
pnpm --filter frontend dev        # Frontend only
pnpm build                        # Build both packages
pnpm format                       # Sort imports (Biome)
pnpm format:check                 # Check import sorting (CI)

# Database
pnpm db:migrate                   # Run migrations
pnpm db:generate                  # Generate from schema changes
pnpm db:push                      # Push schema directly (dev)
pnpm db:reset                     # Reset database

# Infrastructure
pnpm infra:up                     # Start PostgreSQL
pnpm infra:down                   # Stop PostgreSQL
docker compose up -d              # Full production stack
```

## Architecture

### Clean Architecture / Hexagonal (Backend)

```
domain/                → NOTHING external (pure business logic)
  {domain}/entities/   → Entity classes (immutable)
  {domain}/ports/      → Repository interfaces (contracts)
  {domain}/*.service.ts → One consolidated service per domain
  {domain}/*.vo.ts     → Value objects (typed enums)
  shared/              → Cross-domain errors, types, shared ports

infrastructure/        → External concerns (imports domain/)
  adapters/persistence/ → Drizzle ORM repositories
  adapters/ai/         → Multi-agent system (ADK)
  config/              → DI container
  endpoints/           → tRPC routers
  middleware/           → Express middleware
```

**NEVER import infrastructure from domain.**

### Domains

| Domain | Entities | Status | AI Agent |
|--------|----------|--------|----------|
| Task | Task | Complete | TaskAgent |
| Note | Note | Complete | NoteAgent |
| Goal | Goal, Milestone | In Progress | GoalAgent |
| Conversation | Conversation, Message | Complete | (via Router) |

### Multi-Agent AI System

```
User Chat → RouterAgent → DomainAgentRegistry
                              ├→ TaskAgent (task tools)
                              ├→ NoteAgent (note tools)
                              └→ GoalAgent (goal tools)
                                    ↓
                              Gemini 2.0 Flash + Langfuse
```

### Frontend

```
src/
├── app/          # Providers, router (lazy-loaded pages)
├── components/   # Feature components (chat/, tasks/, notes/, goals/, ui/)
├── hooks/        # Domain hooks (useTasks, useNotes, useGoals, useChat)
├── lib/          # tRPC client, Zod schemas, utilities
├── pages/        # Page components
├── types/        # TypeScript interfaces
└── config/       # Constants, env vars
```

## Conventions

- **ESM only** — imports use `.js` extensions
- **Strict TypeScript** — no `any`
- **Barrel exports** — every directory has `index.ts`
- **Backend**: kebab-case files, PascalCase types, one service per domain
- **Frontend**: relative imports, `cn()` for Tailwind, CVA for variants
- **Domain errors** — typed errors extending `AppError`
- **Value objects** — `as const` pattern for statuses/categories
- **Import sorting** — Biome (`pnpm format`) — auto-sorts on save via VS Code extension
- **Forms** — Zod schema + React Hook Form + zodResolver

## API (tRPC)

- `task.*` — list, getById, search, create, update, delete
- `note.*` — list, getById, search, create, update, delete
- `goal.*` — list, getById, search, create, update, delete, toggleMilestone
- `agent.*` — createConversation, listConversations, getConversation, deleteConversation, getMessages, chat, chatStream
- `GET /health` — Detailed health status
- `GET /health/live` — Liveness probe
- `GET /health/ready` — Readiness probe

## Database

PostgreSQL 16 with Drizzle ORM. Schema in `packages/backend/src/infrastructure/adapters/persistence/drizzle/schema.ts`.

Tables: `tasks`, `notes`, `goals`, `milestones`, `conversations`, `messages`

Enums: `task_status`, `note_category`, `goal_status`, `goal_category`, `message_role`

## Package-Level Guides

Detailed guides for each package:
- **Backend**: `packages/backend/CLAUDE.md` — architecture, patterns, adding domains, AI system
- **Frontend**: `packages/frontend/CLAUDE.md` — components, hooks, routing, styling
