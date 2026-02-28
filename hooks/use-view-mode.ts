"use client";

import { useEffect, useState } from "react";

export type ViewMode = "table" | "card";

/**
 * Hook for managing view mode (table/card) with localStorage persistence.
 * Works in tandem with the ViewToggle component.
 */
export function useViewMode(
  storageKey: string,
  defaultView: ViewMode = "table",
): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(`view-toggle-${storageKey}`);
    if (stored === "table" || stored === "card") {
      setView(stored);
    }
  }, [storageKey]);

  return [view, setView];
}
