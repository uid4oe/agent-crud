import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useKeyboardShortcuts } from "../../hooks";

export function MainLayout() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-surface text-ink font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-white relative md:rounded-[1.5rem] shadow-sm flex flex-col min-w-0 overflow-hidden md:m-2 md:ml-0">
        <Outlet />
      </main>
    </div>
  );
}
