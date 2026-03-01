import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary } from "../../components/feedback/ErrorBoundary";
import { ToastContainer } from "../../components/feedback/ToastContainer";
import { trpc, trpcClient } from "../../lib/trpc";
import { ToastProvider } from "./ToastProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
