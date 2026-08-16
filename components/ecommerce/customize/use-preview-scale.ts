// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scales the desktop preview so the shop is laid out at a **real desktop width**
 * and then shrunk to fit the admin panel, instead of being laid out at whatever
 * width the panel happens to be.
 *
 * ⚠ This is not cosmetic. The storefront's desktop layouts are media-query
 * driven, and the panel is far narrower than the screen it stands in for — on a
 * 1440px window the frame measures **860px**, under the 1000px breakpoint where
 * `.sf-rail-grid` reserves its column. So Meridian Care, whose entire identity
 * is the department rail, previewed with **no rail at all** on the most common
 * laptop size, and a merchant comparing it against the others was shown a
 * different theme from the one they would get.
 *
 * Fixing it by lowering the breakpoint would have been backwards: that changes
 * what real shoppers see in order to fix an artefact of the admin chrome. The
 * frame is the thing that is wrong, so the frame is what gets corrected.
 *
 * Mobile needs none of this — 390px is a real phone width, so that preview is
 * already showing the layout a shopper gets.
 */

/** The desktop the preview stands in for. Comfortably clears every breakpoint. */
export const DESKTOP_PREVIEW_WIDTH = 1280;

export function usePreviewScale(enabled: boolean) {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);

  // A callback ref, not `useRef` + `useEffect`: the host element is swapped when
  // the device toggle flips, and a plain ref would leave the observer watching a
  // node that is no longer in the tree.
  const hostRef = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    observer.current = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.current.observe(node);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  // Never scale UP: on a wide monitor the panel can exceed 1280, and stretching
  // the shop past its own layout width would misreport the spacing.
  const scale =
    enabled && width > 0 ? Math.min(1, width / DESKTOP_PREVIEW_WIDTH) : 1;

  /**
   * Whether the frame may mount yet.
   *
   * ⚠ Load-bearing, and it cost a round of browser QA to find. A cross-origin
   * iframe — which this is, the storefront being on its own subdomain — does
   * **not repaint when its transform changes after load**. Chrome keeps showing
   * the stale (blank) layer until something forces a relayout, so mounting the
   * frame at scale 1 and correcting it a tick later left the Customize preview
   * white until the device toggle was clicked. Everything measured fine while it
   * was invisible: correct width, correct transform, `visibility: visible`, a
   * 2005px scroll height and a fully built DOM inside.
   *
   * Waiting one frame for the measurement means the frame's FIRST paint already
   * carries its final transform, so there is nothing to correct.
   */
  const ready = !enabled || width > 0;

  return { hostRef, scale, ready };
}
