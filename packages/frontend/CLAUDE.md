# Frontend — Developer Guide

React 19 + TypeScript frontend with tRPC for type-safe API communication and AI chat capabilities.

## Commands

```bash
pnpm dev        # Dev server on port 5173
pnpm build      # Type check + production build
pnpm lint       # ESLint
pnpm format     # Sort imports (Biome, from root)
pnpm preview    # Preview production build
```

## Architecture

```
src/
├── app/                    # Providers, router (lazy-loaded pages)
├── components/
│   ├── chat/               # Chat UI, message list, conversations
│   ├── tasks/              # Task management (Kanban, forms)
│   ├── notes/              # Note management
│   ├── goals/              # Goal + milestone tracking
│   ├── layout/             # Header, MainLayout
│   ├── feedback/           # ErrorBoundary, Toast
│   └── ui/                 # Primitive components (Button, Input, etc.)
├── config/                 # Constants, environment variables
├── hooks/                  # useChat, useTasks, useNotes, useGoals
├── lib/
│   ├── trpc.ts             # tRPC client setup
│   ├── utils.ts            # Utilities (cn helper)
│   └── validation/         # Zod schemas per domain
├── pages/                  # Page components (lazy loaded)
└── types/                  # TypeScript interfaces
```

## Key Patterns

**State Management**
- Server state: tRPC + TanStack Query (React Query)
- UI state: `useState` / `useRef`
- Global state: Context (ToastProvider)

**Forms** — Zod schemas in `lib/validation/` + React Hook Form with `zodResolver`.

**Styling** — Tailwind utilities + CVA for component variants + `cn()` for conditional classes.

**Routing** — React Router 7 with lazy-loaded pages. Routes defined in `app/router/routes.tsx`.

**Code Splitting** — Separate chunks for vendor, query, forms, and UI libraries. Pages lazy-loaded via `React.lazy()`.

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | — | Redirects to `/chat` |
| `/chat` | ChatPage | AI chat interface |
| `/chat/:conversationId` | ChatPage | Specific conversation |
| `/tasks` | TasksPage | Task Kanban + management |
| `/notes` | NotesPage | Note management |
| `/goals` | GoalsPage | Goal + milestone tracking |

## Conventions

- **Relative imports** within the package
- **Barrel exports** — every directory has `index.ts`
- **`cn()`** for composing Tailwind classes
- **CVA** for component variant definitions
- **`type` imports** for TypeScript interfaces

## Adding a New Feature

1. Add types to `types/index.ts`
2. Add constants to `config/constants.ts`
3. Create Zod schema in `lib/validation/{feature}.schema.ts`
4. Create hook in `hooks/use{Feature}.ts`
5. Create components in `components/{feature}/` with barrel export
6. Create page in `pages/{Feature}Page.tsx`
7. Add route in `app/router/routes.tsx`
8. Add nav item in `components/layout/Header.tsx`
