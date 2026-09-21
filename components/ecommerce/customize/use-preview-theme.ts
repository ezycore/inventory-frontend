"use client";
// coding-standard: maintained

import { useCallback, useEffect, useState, type RefObject } from "react";
import { PREVIEW_THEME_MESSAGE } from "@/lib/storefront-preview";

export type PreviewTheme = "light" | "dark";

/**
 * The light/dark the preview frame is drawing in, and the post that tells it so
 * — shared by Customize's `BrowserPreview` and the page editor's
 * `PagePreviewFrame`.
 *
 * Starts on `light` and posts unconditionally, including that first `light`:
 * the frame is the real shop on the shop's own origin, so a merchant who once
 * toggled their live shop to dark had every preview render dark while the editor
 * said nothing. The post is what makes the two agree.
 *
 * `postTheme` is returned as well as run on change, because a frame that
 * (re)loads has no override yet — every caller sends it again when the frame
 * announces itself ready.
 */
export function usePreviewTheme(frameRef: RefObject<HTMLIFrameElement | null>) {
  const [theme, setTheme] = useState<PreviewTheme>("light");

  const postTheme = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_THEME_MESSAGE, payload: { theme } },
      "*",
    );
  }, [frameRef, theme]);

  useEffect(() => {
    postTheme();
  }, [postTheme]);

  return { theme, setTheme, postTheme };
}
