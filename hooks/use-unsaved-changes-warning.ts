"use client";
// coding-standard: maintained

import { useEffect } from "react";

/**
 * While `dirty`, closing or reloading the tab asks first — the browser's own
 * prompt. There is no route-level guard in the app, so this covers leaving the
 * site, not a click to another admin page.
 */
export function useUnsavedChangesWarning(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
