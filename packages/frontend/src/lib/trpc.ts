import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "backend";

export const trpc = createTRPCReact<AppRouter>();

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/trpc";

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl,
    }),
  ],
});
