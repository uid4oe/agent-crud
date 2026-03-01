import { lazy, Suspense, useState, useCallback } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "../../components/layout/MainLayout";
import { ErrorBoundary } from "../../components/feedback/ErrorBoundary";
import { ROUTES } from "../../config";

// Lazy load pages for code splitting
const ChatPage = lazy(() =>
  import("../../pages/ChatPage").then((m) => ({ default: m.ChatPage }))
);
const TasksPage = lazy(() =>
  import("../../pages/TasksPage").then((m) => ({ default: m.TasksPage }))
);
const NotesPage = lazy(() =>
  import("../../pages/NotesPage").then((m) => ({ default: m.NotesPage }))
);
const WellnessPage = lazy(() =>
  import("../../pages/WellnessPage").then((m) => ({ default: m.WellnessPage }))
);
const NotFoundPage = lazy(() =>
  import("../../pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

const pageLoader = (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-600 rounded-full" />
  </div>
);

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState(0);
  const handleReset = useCallback(() => setKey((k) => k + 1), []);

  return (
    <ErrorBoundary key={key} onReset={handleReset}>
      {children}
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.CHAT} replace />,
      },
      {
        path: "chat",
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={pageLoader}>
              <ChatPage />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: "chat/:conversationId",
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={pageLoader}>
              <ChatPage />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: "tasks",
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={pageLoader}>
              <TasksPage />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: "notes",
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={pageLoader}>
              <NotesPage />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: "wellness",
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={pageLoader}>
              <WellnessPage />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={pageLoader}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
