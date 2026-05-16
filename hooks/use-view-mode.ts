"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "table" | "card";

/**
 * Read the persisted view mode from localStorage synchronously.
 * Returns the stored value if valid, otherwise falls back to defaultView.
 */
function getStoredView(storageKey: string, defaultView: ViewMode): ViewMode {
  if (typeof window === "undefined") return defaultView;
  try {
    const stored = localStorage.getItem(`view-toggle-${storageKey}`);
    if (stored === "table" || stored === "card") return stored;
  } catch {
    // localStorage may be unavailable (SSR, privacy mode, etc.)
  }
  return defaultView;
}

/**
 * Hook for managing view mode (table/card) with localStorage persistence.
 * Reads localStorage **synchronously** on mount so the correct view is shown
 * on the very first render — no flash / blink.
 */
export function useViewMode(
  storageKey: string,
  defaultView: ViewMode = "table",
): [ViewMode, (v: ViewMode) => void, boolean] {
  // Lazy initializer reads localStorage synchronously on the very first render,
  // so there is no flash and no setState-in-effect anti-pattern.
  const [view, setViewInternal] = useState<ViewMode>(() =>
    getStoredView(storageKey, defaultView),
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted so consumers can defer rendering until after hydration.
    // This is the standard SSR-safe "hasMounted" pattern; setState here is
    // intentional and runs exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const setView = useCallback(
    (v: ViewMode) => {
      setViewInternal(v);
      try {
        localStorage.setItem(`view-toggle-${storageKey}`, v);
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  return [view, setView, isMounted];
}
