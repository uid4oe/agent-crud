import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, splitLink, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "backend";

export const trpc = createTRPCReact<AppRouter>();

const httpUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/trpc";

// Determine WebSocket URL from HTTP URL
const wsUrl = httpUrl.replace(/^http/, "ws");

// Create WebSocket client for subscriptions with exponential backoff
const wsClient = createWSClient({
  url: wsUrl,
  retryDelayMs: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
});

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      // Use WebSocket for subscriptions
      condition: (op) => op.type === "subscription",
      true: wsLink({
        client: wsClient,
      }),
      // Use HTTP batch link for queries and mutations
      false: httpBatchLink({
        url: httpUrl,
      }),
    }),
  ],
});
