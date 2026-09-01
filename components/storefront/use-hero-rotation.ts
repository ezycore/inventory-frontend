"use client";
// coding-standard: maintained

import type { PointerEvent as ReactPointerEvent } from "react";
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
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  // A swipe can start over the slide CTA. Browsers synthesize a click after
  // pointerup, so remember the completed swipe long enough to consume that
  // click instead of navigating while the shopper is changing slides.
  const suppressClick = useRef(false);
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

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => {
    setPaused(false);
    setCycle((c) => c + 1);
  }, []);

  /** Hover pauses; leaving resumes AND restarts the beat from now. */
  const hoverProps = {
    onMouseEnter: pause,
    onMouseLeave: resume,
  };

  /** Keyboard focus gets the same reading pause as a pointer hover. */
  const focusProps = {
    onFocus: pause,
    onBlur: resume,
  };

  const resetPointer = useCallback(() => {
    pointer.current = null;
  }, []);

  /**
   * A deliberate horizontal drag moves one slide in the drag's direction.
   * Pointer capture matters on phones: without it, a finger leaving a nested
   * image/link or becoming a browser gesture can strand the carousel after
   * `pointerdown` with no matching `pointerup` on the hero.
   */
  const swipeProps = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      suppressClick.current = false;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      const start = pointer.current;
      if (!start || start.id !== e.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      resetPointer();
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      // Horizontal intent must beat vertical movement as well as the distance
      // threshold, so an ordinary page scroll never changes the promotion.
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick.current = true;
        go(current + (dx < 0 ? 1 : -1));
      }
    },
    onPointerCancel: resetPointer,
    onLostPointerCapture: resetPointer,
    onClickCapture: (e: { preventDefault: () => void; stopPropagation: () => void }) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  return { current, paused, cycle, go, hoverProps, focusProps, swipeProps };
}
