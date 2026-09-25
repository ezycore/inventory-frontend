// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewDevice } from "@/components/ecommerce/customize/preview-stage";

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
 * Mobile gets the same treatment for a different reason. Drawn 1:1, the phone
 * frame was 370px of laptop pixels wide and as tall as the pane — physically
 * larger than a phone, the wrong shape, and next to a desktop shrunk to ~0.6 it
 * read as zoomed in. So the frame is laid out at a real phone viewport and the
 * whole phone is shrunk until it fits the pane, bezel and all.
 */

/** The desktop the preview stands in for. Comfortably clears every breakpoint. */
export const DESKTOP_PREVIEW_WIDTH = 1280;

/** The phone the preview stands in for: a common modern handset's viewport. */
export const MOBILE_PREVIEW = { width: 390, height: 844 };

/** The phone shell around the mobile frame — its bezel, and its gap from the pane's edges. */
export const PHONE_BEZEL = 10;
const PHONE_GAP_Y = 20;
const PHONE_GAP_X = 8;

export function usePreviewScale(device: PreviewDevice) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const observer = useRef<ResizeObserver | null>(null);

  // A callback ref, not `useRef` + `useEffect`: a caller that remounts the stage
  // (a reload, a page switch) would leave a plain ref's observer watching a node
  // that is no longer in the tree.
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

  // Never scale UP: on a wide monitor the panel can exceed 1280 (or fit a phone
  // taller than 844), and stretching the shop past its own layout would
  // misreport the spacing.
  const measured = box.width > 0 && box.height > 0;
  const scale = !measured
    ? 1
    : device === "desktop"
      ? Math.min(1, box.width / DESKTOP_PREVIEW_WIDTH)
      : Math.max(
          0.1,
          Math.min(
            1,
            (box.height - 2 * (PHONE_GAP_Y + PHONE_BEZEL)) / MOBILE_PREVIEW.height,
            (box.width - 2 * (PHONE_GAP_X + PHONE_BEZEL)) / MOBILE_PREVIEW.width,
          ),
        );

  /**
   * The frame's own height in its UNZOOMED coordinates, so that height × zoom
   * lands exactly on the host. A percentage cannot do this: under `zoom` it
   * resolves in the zoomed space and the frame comes up short.
   */
  const height = device === "desktop" && box.height > 0 ? box.height / scale : 0;

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
  const ready = measured;

  return { hostRef, scale, ready, frameHeight: height };
}
