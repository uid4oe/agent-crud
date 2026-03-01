# Frontend Development Guide

## Project Overview

React 19 + TypeScript frontend for a task and note management application with AI chat capabilities. Uses tRPC for type-safe API communication with the backend.

## Tech Stack

- **Framework:** React 19, TypeScript 5.9
- **Build:** Vite 7
- **Routing:** React Router 7
- **State:** TanStack Query (React Query) 5 + tRPC
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS 3 + CVA (class-variance-authority)

## Architecture

### Folder Structure

```
src/
├── app/                    # Application shell
│   ├── providers/          # Context providers (AppProviders, ToastProvider)
│   └── router/             # Route configuration with lazy loading
├── components/
│   ├── chat/               # Chat feature components
│   ├── feedback/           # ErrorBoundary, Toast, ToastContainer
│   ├── layout/             # Header, MainLayout
│   ├── notes/              # Note management components
│   ├── tasks/              # Task management components
│   └── ui/                 # Primitive UI components (Button, Input, etc.)
├── config/                 # Constants, environment variables
├── hooks/                  # Custom hooks (useChat, useTasks, useNotes)
├── lib/
│   ├── trpc.ts             # tRPC client setup
│   ├── utils.ts            # Utilities (cn function)
│   └── validation/         # Zod schemas (task.schema.ts, note.schema.ts)
├── pages/                  # Page components (lazy loaded)
└── types/                  # TypeScript interfaces
```

### Key Patterns

**Routing:**
- Uses React Router with lazy-loaded pages
- Routes defined in `app/router/routes.tsx`
- URL params for deep linking (e.g., `/chat/:conversationId`)

**State Management:**
- Server state via tRPC + React Query
- UI state via useState/useRef
- Global state via Context (ToastProvider)

**Forms:**
- Zod schemas in `lib/validation/`
- React Hook Form with `zodResolver`
- Schema types exported for reuse (e.g., `TaskFormSchema`)

**Styling:**
- Tailwind utilities for layout/spacing
- CVA for component variants
- `cn()` helper for conditional classes

## Commands

```bash
pnpm dev      # Start dev server (port 5173)
pnpm build    # Type check + production build
pnpm lint     # Run ESLint
pnpm preview  # Preview production build
```

## Conventions

### Imports

Use relative imports within the frontend package:
```typescript
import { Button } from "../components/ui/button";
import { ROUTES } from "../config";
import type { TaskFormSchema } from "../lib/validation";
```

Path alias `@/*` is configured but prefer relative imports for consistency.

### Components

- Feature components go in `components/{feature}/`
- Each folder has an `index.ts` barrel export
- UI primitives in `components/ui/` are headless/unstyled base components

### Types

- Domain types (Task, Note, Message, Conversation) in `types/index.ts`
- Form schemas with Zod in `lib/validation/`
- Use `type` imports: `import type { Task } from "../types"`

### Hooks

- Custom hooks in `hooks/` folder
- Feature hooks (useChat, useTasks, useNotes) encapsulate tRPC queries/mutations
- Return object with state and methods

### Configuration

- Environment variables: `config/env.ts`
- Constants (routes, statuses): `config/constants.ts`
- All exports through `config/index.ts` barrel

## Code Splitting

Production build creates separate chunks:
- `vendor` - React, React DOM, React Router
- `query` - TanStack Query, tRPC
- `forms` - Zod, React Hook Form
- `ui` - Lucide icons, CVA, clsx

Pages are lazy loaded via React.lazy().

## Error Handling

- Global `ErrorBoundary` wraps the app
- Toast notifications via `useToast()` hook
- Per-component error states for queries

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | - | Redirects to `/chat` |
| `/chat` | ChatPage | AI chat interface |
| `/chat/:conversationId` | ChatPage | Specific conversation |
| `/tasks` | TasksPage | Task management |
| `/notes` | NotesPage | Note management |

## Features

### Tasks
- **Components:** `TaskForm`, `TaskTable`, `DeleteTaskDialog`, `EmptyState`
- **Hook:** `useTasks()` - CRUD operations for tasks
- **Schema:** `taskFormSchema` (title, description, status)

### Notes
- **Components:** `NoteForm`, `NoteList`, `DeleteNoteDialog`, `EmptyState`
- **Hook:** `useNotes()` - CRUD operations for notes
- **Schema:** `noteFormSchema` (title, content, category, tags)
- **Categories:** general, idea, reference, meeting, personal

### Chat
- **Components:** `ChatInput`, `MessageList`, `ConversationList`
- **Hook:** `useChat()` - Conversation and message operations
- AI-powered chat with multi-agent backend

## Adding New Features

1. Add types to `types/index.ts`
2. Add constants to `config/constants.ts` and export in `config/index.ts`
3. Create Zod schema in `lib/validation/{feature}.schema.ts`
4. Create custom hook in `hooks/use{Feature}.ts`
5. Create components in `components/{feature}/`
6. Add barrel export in `components/{feature}/index.ts`
7. Create page in `pages/{Feature}Page.tsx`
8. Add route in `app/router/routes.tsx`
9. Add nav item in `components/layout/Header.tsx`
