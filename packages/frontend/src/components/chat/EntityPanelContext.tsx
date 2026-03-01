import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";

export type PanelDomain = "tasks" | "notes" | "goals";

interface EntityPanelState {
  isOpen: boolean;
  activeDomain: PanelDomain | null;
  openPanel: (domain: PanelDomain) => void;
  closePanel: () => void;
  setDomain: (domain: PanelDomain) => void;
  highlightEntity: (entityId: string) => void;
}

const EntityPanelContext = createContext<EntityPanelState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useEntityPanel(): EntityPanelState {
  const ctx = useContext(EntityPanelContext);
  if (!ctx) throw new Error("useEntityPanel must be used within EntityPanelProvider");
  return ctx;
}

const HIGHLIGHT_DURATION = 2200;

export function EntityPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDomain, setActiveDomain] = useState<PanelDomain | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHighlightEl = useRef<Element | null>(null);

  const openPanel = useCallback((domain: PanelDomain) => {
    setActiveDomain(domain);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setDomain = useCallback((domain: PanelDomain) => {
    setActiveDomain(domain);
  }, []);

  const highlightEntity = useCallback((entityId: string) => {
    // Clear previous highlight
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    if (prevHighlightEl.current) {
      prevHighlightEl.current.removeAttribute("data-entity-highlight");
      prevHighlightEl.current = null;
    }

    // Find, scroll, and highlight after a short delay (allow panel open + React Query refetch)
    setTimeout(() => {
      const el = document.querySelector(`[data-entity-id="${entityId}"]`);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.setAttribute("data-entity-highlight", "true");
      prevHighlightEl.current = el;

      highlightTimer.current = setTimeout(() => {
        el.removeAttribute("data-entity-highlight");
        prevHighlightEl.current = null;
        highlightTimer.current = null;
      }, HIGHLIGHT_DURATION);
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  return (
    <EntityPanelContext.Provider value={{ isOpen, activeDomain, openPanel, closePanel, setDomain, highlightEntity }}>
      {children}
    </EntityPanelContext.Provider>
  );
}
