// coding-standard: maintained
import { useEffect, useState } from "react";

/**
 * Mount/paint choreography for a CSS-transitioned overlay (drawer, sheet).
 *
 * A transition only runs if the closed state *painted* first, and the exit is
 * only visible if the node stays mounted until it finishes — so an overlay
 * needs two flags, not one: `mounted` (is it in the tree) and `shown` (does it
 * carry the open class). Shared by `SideDrawer` and `QuickBuySheet`; both had
 * otherwise identical copies of this.
 *
 * @param exitMs must cover the CSS exit transition, or the node unmounts mid-slide.
 */
export function useOverlayTransition(
  open: boolean,
  exitMs: number,
): { mounted: boolean; shown: boolean } {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  // Synchronous halves — render-time adjustments, deliberately not effects, so
  // the closed position paints in the same commit the overlay mounts in.
  if (open && !mounted) setMounted(true);
  if (!open && shown) setShown(false);

  useEffect(() => {
    if (open) {
      // Double rAF: a single frame can land before the closed state has
      // painted, and the browser then coalesces both states into no transition.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted, shown };
}
