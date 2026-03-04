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
  const [view, setViewInternal] = useState<ViewMode>();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      const storedView = getStoredView(storageKey, defaultView);
      if (storedView !== view) {
        setViewInternal(storedView);
      }
    }
  }, [storageKey, defaultView, view, isMounted]);

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
