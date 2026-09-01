"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The advance/pause/swipe behaviour a rotating hero needs, extracted so the two
 * heroes that rotate cannot disagree about it.
 *
 * Both `HeroCarousel` (contained card) and `HeroFullBleed` (edge to edge) show
 * the same merchant slides on the same 5s beat with the same pause rules; only
 * their LAYOUT differs. Copying the timer into the second one would have been
 * two places to fix a dropped `clearInterval` or a missed reduced-motion check —
 * the repo's "extract on the second use" rule, and this is the second use.
 *
 * Two behaviours worth keeping when you touch this:
 *  - **`cycle` restarts the dot's fill animation.** It is bumped on every manual
 *    move so the progress indicator resets with the timer rather than finishing
 *    a run for a slide the shopper already left.
 *  - **Reduced motion stops the autoplay, not the carousel.** The arrows, dots
 *    and swipe still work; nothing moves on its own.
 */
export const HERO_INTERVAL_MS = 5000;

export function useHeroRotation(count: number) {
  const [storedCurrent, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const downX = useRef<number | null>(null);
  // A live preview can delete slides without remounting the hero. Clamp at
  // render time so it never spends a frame reading an index that no longer
  // exists; the next move writes the clamped value back into state.
  const current = count > 0 ? Math.min(storedCurrent, count - 1) : 0;

  const go = useCallback(
    (i: number) => {
      if (count < 1) return;
      setCurrent(((i % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % count),
      HERO_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [paused, count, cycle]);

  /** Hover pauses; leaving resumes AND restarts the beat from now. */
  const hoverProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => {
      setPaused(false);
      setCycle((c) => c + 1);
    },
  };

  /** A horizontal drag past 40px moves one slide, in the drag's direction. */
  const swipeProps = {
    onPointerDown: (e: { clientX: number }) => {
      downX.current = e.clientX;
    },
    onPointerUp: (e: { clientX: number }) => {
      if (downX.current === null) return;
      const dx = e.clientX - downX.current;
      downX.current = null;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    },
  };

  return { current, paused, cycle, go, hoverProps, swipeProps };
}
