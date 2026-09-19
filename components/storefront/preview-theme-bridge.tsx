"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { PREVIEW_THEME_MESSAGE } from "@/lib/storefront-preview";
import { setPreviewTheme } from "@/services/storefront/ui-context";

/**
 * Light/dark for an admin preview frame, driven by the editor's toggle.
 *
 * Mounted by the storefront layout rather than by either preview's own bridge:
 * both admin previews send this message (`StorePreviewBridge` is Customize's
 * alone, `PageDraftPreview` the page editor's), and a builder landing page draws
 * without the shell, so there is no one component below that both frames mount.
 * Off entirely outside `?preview=1`, like every other preview receiver.
 *
 * The override is module state, so it survives a client-side navigation inside
 * the frame — a merchant who previews dark and clicks through to another page
 * stays in dark.
 */
export function PreviewThemeBridge() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("preview") !== "1") return;

    const onMessage = (event: MessageEvent) => {
      // Only the frame's own parent — the editor — may drive the theme.
      if (event.source !== window.parent) return;
      if (event.data?.type !== PREVIEW_THEME_MESSAGE) return;
      const theme = event.data.payload?.theme;
      if (theme === "light" || theme === "dark") setPreviewTheme(theme);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
