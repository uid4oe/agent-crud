# Backend Package

Express.js + tRPC backend with Clean Architecture, PostgreSQL, and multi-agent AI system.

## Quick Commands

```bash
pnpm dev              # Start dev server with hot reload
pnpm build            # TypeScript compile to dist/
pnpm start            # Run compiled code
pnpm db:migrate       # Run database migrations
pnpm db:generate      # Generate migrations from schema changes
pnpm db:push          # Push schema directly to DB (dev only)
```

## Architecture

**Clean Architecture / Hexagonal** with domain-first organization:

```
src/
├── domain/                        # Business logic (no external dependencies)
│   ├── task/                      # Task domain
│   │   ├── entities/              # Task entity
│   │   ├── ports/                 # TaskRepositoryPort
│   │   ├── task.service.ts        # TaskService
│   │   ├── task-status.vo.ts      # TaskStatus value object
│   │   └── index.ts               # Domain exports
│   │
│   ├── note/                      # Note domain
│   │   ├── entities/              # Note entity
│   │   ├── ports/                 # NoteRepositoryPort
│   │   ├── note.service.ts        # NoteService
│   │   ├── note-category.vo.ts    # NoteCategory value object
│   │   └── index.ts
│   │
│   ├── conversation/              # Conversation domain
│   │   ├── entities/              # Conversation, Message entities
│   │   ├── ports/                 # ConversationRepositoryPort, MessageRepositoryPort
│   │   ├── conversation.service.ts
│   │   ├── message-role.vo.ts     # MessageRole value object
│   │   └── index.ts
│   │
│   ├── shared/                    # Shared domain concerns
│   │   ├── errors/                # Domain error classes (AppError, TaskNotFoundError, etc.)
│   │   ├── types/                 # Pagination types
│   │   └── ports/                 # Shared ports (AiAgentPort, DomainAgentPort, etc.)
│   │
│   └── index.ts                   # Re-exports all domains
│
├── infrastructure/                # External concerns
│   ├── adapters/
│   │   ├── persistence/drizzle/   # PostgreSQL repositories
│   │   ├── ai/agents/             # Domain-specific agents (TaskAgent, NoteAgent)
│   │   ├── ai/router/             # Router agent (orchestrates domain agents)
│   │   ├── ai/tools/              # AI tool plugin system
│   │   └── observability/         # Langfuse tracing
│   ├── config/                    # Configuration & DI container
│   ├── endpoints/                 # tRPC routers
│   ├── middleware/                # Express middleware
│   ├── logging/                   # Structured logger
│   └── health/                    # Health check endpoints
│
└── main.ts                        # Entry point
```

## Domain Services

Each domain has a **single consolidated service** handling all operations:

```typescript
// TaskService - all task operations
taskService.list({ status? })     // List tasks
taskService.get({ id })           // Get by ID (throws if not found)
taskService.findById(id)          // Get by ID (returns null)
taskService.create({ title, description?, status? })
taskService.update({ id, title?, description?, status? })
taskService.delete({ id })
taskService.search(query, status?)
taskService.count() / countByStatus(status)

// NoteService - all note operations
noteService.list({ category?, tag? })
noteService.get({ id }) / findById(id)
noteService.create({ title, content, category?, tags? })
noteService.update({ id, title?, content?, category?, tags? })
noteService.delete({ id })
noteService.search(query, category?)
noteService.getAllTags()

// ConversationService - all conversation/chat operations
conversationService.list()
conversationService.get({ id }) / findById(id)
conversationService.create({ title? })
conversationService.delete({ id })
conversationService.getMessages({ conversationId })
conversationService.chat({ conversationId, message })
```

## Key Patterns

### Dependency Injection
All dependencies wired in `infrastructure/config/container.ts`:
```typescript
const container = {
  // Repositories
  taskRepository, noteRepository, conversationRepository, messageRepository,

  // Domain Services (one per domain)
  taskService, noteService, conversationService,

  // AI
  domainAgentRegistry, aiAgent,
  // ...
};
```

### Repository Pattern
Each domain defines its own port interface, infrastructure implements them (`adapters/persistence/`).

### Error Handling
Use domain errors from `domain/shared/errors/`:
```typescript
import { TaskNotFoundError, NoteNotFoundError } from "../../domain/index.js";
throw new TaskNotFoundError(id);
```

## Multi-Agent System

The AI system uses a **Router Agent** that orchestrates **Domain Agents**:

```
User Message → RouterAgent → DomainAgentRegistry
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               TaskAgent       NoteAgent      (future agents)
                    │               │
                    ▼               ▼
              Task Tools       Note Tools
```

**Key components:**
- `DomainAgentRegistry` - Manages all domain agents
- `RouterAgent` - Analyzes intent, delegates to domain agents (supports parallel delegation)
- `BaseDomainAgent` - Abstract base class with shared Gemini/Langfuse logic
- `TaskAgent` - Task management domain agent
- `NoteAgent` - Note management domain agent

### Adding a New Domain

1. **Create domain layer:**
   ```
   domain/your-domain/
   ├── entities/
   │   └── your-entity.entity.ts
   ├── ports/
   │   └── your-entity.repository.port.ts
   ├── your-domain.service.ts
   ├── your-enum.vo.ts (if needed)
   └── index.ts
   ```

2. **Update domain index:**
   ```typescript
   // domain/index.ts
   export * from "./your-domain/index.js";
   ```

3. **Add domain-specific errors to `domain/shared/errors/index.ts`**

4. **Create infrastructure:**
   ```
   infrastructure/adapters/
   ├── persistence/drizzle/
   │   ├── schema.ts (add table)
   │   └── your-entity.repository.ts
   └── ai/
       ├── tools/your-domain-tools.plugin.ts
       └── agents/your-domain/
           ├── your-domain.agent.ts
           └── your-domain.prompt.ts
   ```

5. **Register in container.ts:**
   ```typescript
   // Repository
   const yourRepository = new DrizzleYourRepository(db);

   // Service
   const yourService = new YourService(yourRepository);

   // Agent
   const yourAgent = new YourAgent(yourRepository, geminiConfig, logger);
   domainAgentRegistry.register(yourAgent);
   ```

### Domain Agent Template

```typescript
export class YourDomainAgent extends BaseDomainAgent {
  readonly metadata: DomainAgentMetadata = {
    domain: "your-domain",
    name: "Your Domain Agent",
    description: "What this agent does",
    capabilities: [
      { name: "create", description: "Create new items" },
      { name: "read", description: "List and retrieve items" },
      // ...
    ],
  };

  constructor(repository: YourRepositoryPort, config: DomainAgentConfig, logger: Logger) {
    super(config, logger);
    this.initializeTools();
  }

  protected getSystemPrompt(): string {
    return YOUR_DOMAIN_SYSTEM_PROMPT;
  }

  protected async initializeTools(): Promise<void> {
    await this.toolRegistry.register(createYourToolsPlugin(this.repository));
  }
}
```

### Tools Plugin Template

```typescript
export function createYourToolsPlugin(repository: YourRepositoryPort): ToolPlugin {
  const tools: ToolDefinition[] = [
    {
      name: "listItems",
      description: "List all items",
      parameters: { type: SchemaType.OBJECT, properties: {} },
      handler: async () => {
        const items = await repository.findAll();
        return JSON.stringify(items, null, 2);
      },
    },
    // ... more tools
  ];

  return createPlugin({ name: "your-tools", version: "1.0.0" }, tools);
}
```

## Environment Variables

Required in `../../.env`:
```
DATABASE_URL=postgres://...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_BASE_URL=...
```

Optional:
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug|info|warn|error
LOG_FORMAT=pretty|json
RATE_LIMIT_ENABLED=true
```

## API Endpoints

- `GET /health` - Detailed health status
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `POST /trpc/*` - tRPC endpoints (task.*, note.*, agent.*)

## Database

PostgreSQL with Drizzle ORM. Schema in `infrastructure/adapters/persistence/drizzle/schema.ts`.

Tables: `tasks`, `notes`, `conversations`, `messages`

## Testing

Place tests adjacent to code or in `__tests__/` directories. Use repository interfaces for mocking.
