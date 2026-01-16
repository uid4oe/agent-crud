FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile --filter backend

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY packages/backend ./packages/backend
COPY package.json pnpm-workspace.yaml ./
WORKDIR /app/packages/backend
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY packages/backend/package.json ./packages/backend/
COPY packages/backend/drizzle ./packages/backend/drizzle
WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["sh", "-c", "node dist/infrastructure/adapters/persistence/drizzle/migrate.js && node dist/main.js"]
