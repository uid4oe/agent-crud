import { useSyncExternalStore } from "react";

const query = "(max-width: 768px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
