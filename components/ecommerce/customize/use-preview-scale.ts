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
  const [box, setBox] = useState({ width: 0, height: 0 });
  const observer = useRef<ResizeObserver | null>(null);

  // A callback ref, not `useRef` + `useEffect`: the host element is swapped when
  // the device toggle flips, and a plain ref would leave the observer watching a
  // node that is no longer in the tree.
  const hostRef = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    const r = node.getBoundingClientRect();
    setBox({ width: r.width, height: r.height });
    observer.current = new ResizeObserver(([entry]) => {
      setBox({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.current.observe(node);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  // Never scale UP: on a wide monitor the panel can exceed 1280, and stretching
  // the shop past its own layout width would misreport the spacing.
  const scale =
    enabled && box.width > 0
      ? Math.min(1, box.width / DESKTOP_PREVIEW_WIDTH)
      : 1;

  /**
   * The frame's own height in its UNZOOMED coordinates, so that height × zoom
   * lands exactly on the host. A percentage cannot do this: under `zoom` it
   * resolves in the zoomed space and the frame comes up short.
   */
  const height = box.height > 0 ? box.height / scale : 0;

  /**
   * Whether the frame may mount yet.
   *
   * Kept from the transform era, and still worth having: the frame mounts only
   * once the host has been measured, so it is laid out at its final size from
   * the first paint rather than at 1:1 and corrected a tick later. The blank-
   * preview bug that motivated it is now fixed properly by using `zoom` instead
   * of `transform` (see browser-preview.tsx), but there is no reason to render
   * a frame at the wrong size for one frame.
   */
  const ready = !enabled || box.width > 0;

  return { hostRef, scale, ready, frameHeight: height };
}
