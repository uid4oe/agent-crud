# Backend — Developer Guide

Express.js + tRPC backend with Clean Architecture, PostgreSQL, and a multi-agent AI system.

## Commands

```bash
pnpm dev              # Dev server with hot reload
pnpm build            # TypeScript compile to dist/
pnpm start            # Run compiled output
pnpm db:migrate       # Run database migrations
pnpm db:generate      # Generate migrations from schema changes
pnpm db:push          # Push schema directly to DB (dev only)
pnpm db:seed          # Seed sample data
pnpm format           # Sort imports (Biome, from root)
```

## Architecture

Clean Architecture / Hexagonal with domain-first organization. **The domain layer has zero external dependencies.**

```
src/
├── domain/                        # Business logic (pure)
│   ├── task/                      # Task entity, service, repository port
│   ├── note/                      # Note entity, service, repository port
│   ├── goal/                      # Goal + Milestone entities, service, port
│   ├── conversation/              # Conversation + Message entities
│   ├── shared/                    # Domain errors, types, shared ports
│   └── index.ts                   # Re-exports all domains
│
├── infrastructure/                # External concerns
│   ├── adapters/
│   │   ├── persistence/drizzle/   # PostgreSQL repositories
│   │   ├── ai/agents/             # Domain-specific agents
│   │   ├── ai/router/             # Router agent (orchestrator)
│   │   ├── ai/tools/              # AI tool plugin system
│   │   └── observability/         # Langfuse tracing
│   ├── config/                    # DI container, Zod-validated config
│   ├── endpoints/                 # tRPC routers
│   ├── middleware/                # Error handling, rate limiting, logging
│   ├── logging/                   # Structured logger
│   └── health/                    # Health check endpoints
│
└── main.ts                        # Entry point
```

## Domain Services

Each domain has a single consolidated service. Pattern:

```typescript
service.list(filters?)       // List with optional filters
service.get({ id })          // Get by ID (throws if not found)
service.findById(id)         // Get by ID (returns null)
service.create({ ... })      // Create entity
service.update({ id, ... })  // Partial update
service.delete({ id })       // Delete
service.search(query, ...)   // Full-text search
```

## Key Patterns

**Dependency Injection** — All dependencies wired in `infrastructure/config/container.ts`.

**Repository Pattern** — Each domain defines a port interface, infrastructure implements it.

**Typed Errors** — Domain errors extend `AppError` from `domain/shared/errors/`.

**Value Objects** — `as const` pattern for statuses, categories, roles.

## Multi-Agent System

```
User Message → RouterAgent → DomainAgentRegistry
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               TaskAgent       NoteAgent       GoalAgent
                    │               │               │
                    ▼               ▼               ▼
              Task Tools       Note Tools      Goal Tools
```

- **RouterAgent** — Classifies intent, delegates to domain agents (supports parallel delegation)
- **BaseDomainAgent** — Abstract base with shared Gemini/Langfuse config
- **DomainAgentRegistry** — Manages agent registration and lookup
- Each agent has a **tools plugin** with typed tool definitions and handlers

### Adding a New Domain

1. Create `domain/your-domain/` with entities, ports, service, value objects, and barrel export
2. Add domain errors to `domain/shared/errors/`
3. Create persistence adapter in `infrastructure/adapters/persistence/drizzle/`
4. Create agent + tools plugin in `infrastructure/adapters/ai/`
5. Wire everything in `infrastructure/config/container.ts`
6. Add tRPC router in `infrastructure/endpoints/`

## API

- `task.*` — CRUD + search
- `note.*` — CRUD + search + tags
- `goal.*` — CRUD + search + milestone toggles
- `agent.*` — Conversations, messages, chat, streaming
- `GET /health` — Detailed health status
- `GET /health/live` — Liveness probe
- `GET /health/ready` — Readiness probe

## Database

PostgreSQL 16 with Drizzle ORM. Schema in `infrastructure/adapters/persistence/drizzle/schema.ts`.

Tables: `tasks`, `notes`, `goals`, `milestones`, `conversations`, `messages`

## Environment

Required in root `.env`:
```
DATABASE_URL=postgres://...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
```

Optional:
```
PORT=3000
LOG_LEVEL=debug|info|warn|error
LOG_FORMAT=pretty|json
RATE_LIMIT_ENABLED=true
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_BASE_URL=http://localhost:3001
```
