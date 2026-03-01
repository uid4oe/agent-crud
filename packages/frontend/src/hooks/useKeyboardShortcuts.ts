import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../config";

interface KeyboardShortcutOptions {
  onCreateNew?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Cmd/Ctrl+K: Focus search (navigate to current page's search or chat)
      if (isMod && e.key === "k") {
        e.preventDefault();
        // Focus the first search input on the page if any
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Cmd/Ctrl+N: Create new item for current page
      if (isMod && e.key === "n" && !e.shiftKey) {
        // Only intercept if we have a create handler
        if (options.onCreateNew) {
          e.preventDefault();
          options.onCreateNew();
        }
        return;
      }

      // Escape: Close any open dialog
      if (e.key === "Escape" && !isInput) {
        // Try to close any open dialog by clicking its close button
        const closeButton = document.querySelector<HTMLButtonElement>('[data-dialog-close]');
        if (closeButton) {
          closeButton.click();
        }
        return;
      }

      // Navigation shortcuts (only when not in input)
      if (!isInput && !isMod) {
        if (e.key === "g") {
          // g + c = go to chat, g + t = tasks, g + n = notes, g + w = wellness
          const handleSecondKey = (e2: KeyboardEvent) => {
            document.removeEventListener("keydown", handleSecondKey);
            switch (e2.key) {
              case "c": navigate(ROUTES.CHAT); break;
              case "t": navigate(ROUTES.TASKS); break;
              case "n": navigate(ROUTES.NOTES); break;
              case "w": navigate(ROUTES.WELLNESS); break;
            }
          };
          document.addEventListener("keydown", handleSecondKey, { once: true });
          // Auto-remove if no second key pressed within 1s
          setTimeout(() => document.removeEventListener("keydown", handleSecondKey), 1000);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location.pathname, options]);
}
