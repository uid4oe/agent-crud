import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type PanelDomain = "tasks" | "notes" | "goals";

interface EntityPanelState {
  isOpen: boolean;
  activeDomain: PanelDomain | null;
  openPanel: (domain: PanelDomain) => void;
  closePanel: () => void;
  setDomain: (domain: PanelDomain) => void;
}

const EntityPanelContext = createContext<EntityPanelState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useEntityPanel(): EntityPanelState {
  const ctx = useContext(EntityPanelContext);
  if (!ctx) throw new Error("useEntityPanel must be used within EntityPanelProvider");
  return ctx;
}

export function EntityPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDomain, setActiveDomain] = useState<PanelDomain | null>(null);

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

  return (
    <EntityPanelContext.Provider value={{ isOpen, activeDomain, openPanel, closePanel, setDomain }}>
      {children}
    </EntityPanelContext.Provider>
  );
}
