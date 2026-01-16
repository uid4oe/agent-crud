import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./lib/trpc";
import { Header } from "./components/layout";
import { ChatPage, TasksPage } from "./pages";

const queryClient = new QueryClient();

type Tab = "chat" | "tasks";

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "chat" && <ChatPage />}
        {activeTab === "tasks" && <TasksPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
