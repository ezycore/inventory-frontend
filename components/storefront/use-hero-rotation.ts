"use client";
// coding-standard: maintained

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The advance/pause/swipe behaviour a rotating hero needs, extracted so the
 * heroes that rotate cannot disagree about it.
 *
 * `HeroSlidesView` (a card, or copy on the page) and `HeroFullBleedView` (edge to
 * edge) show the same merchant slides on the same 5s beat with the same pause
 * rules; only their LAYOUT differs. Copying the timer into the second one would
 * have been two places to fix a dropped `clearInterval` or a missed
 * reduced-motion check — the repo's "extract on the second use" rule.
 *
 * Two behaviours worth keeping when you touch this:
 *  - **`cycle` restarts the dot's fill animation.** It is bumped on every manual
 *    move so the progress indicator resets with the timer rather than finishing
 *    a run for a slide the shopper already left.
 *  - **Reduced motion stops the autoplay, not the carousel.** The arrows, dots
 *    and swipe still work; nothing moves on its own.
 */
export const HERO_INTERVAL_MS = 5000;

/**
 * A beat shorter than this is not a slideshow, it is a flicker — and since the
 * value arrives from a merchant's saved settings rather than from code, the
 * floor is enforced here rather than trusted. The editor's own control stops at
 * 2 seconds; this is what holds if a stored value ever gets past it.
 */
const MIN_INTERVAL_MS = 1500;

/**
 * @param intervalMs How long each slide holds, in milliseconds — the hero's
 *   "Seconds per slide" setting. Defaults to the 5s beat every hero used before
 *   the setting existed, so a caller that passes nothing is unchanged.
 */
/**
 * The same beat as a style, for the dots' progress sweep — which is a CSS
 * animation and so cannot read the timer's number.
 *
 * Returns nothing at all for a hero on the default beat, so a hero nobody has
 * retimed sets no custom property and the stylesheet's own 5s stands. That is
 * the builder's rule everywhere: unset means the markup is what it always was.
 */
export const heroBeatVars = (seconds?: number): CSSProperties | undefined =>
  seconds ? ({ "--sf-hero-beat": `${seconds}s` } as CSSProperties) : undefined;

export function useHeroRotation(count: number, intervalMs: number = HERO_INTERVAL_MS) {
  const [storedCurrent, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  // A swipe can start over the slide CTA. Browsers synthesize a click after
  // pointerup, so remember the completed swipe long enough to consume that
  // click instead of navigating while the shopper is changing slides.
  const suppressClickUntil = useRef(0);
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
      Math.max(MIN_INTERVAL_MS, intervalMs),
    );
    return () => clearInterval(timer);
  }, [paused, count, cycle, intervalMs]);

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
      const target = e.target;
      const control =
        target instanceof Element
          ? target.closest("a, button, input, select, textarea, [role='button']")
          : null;
      // The whole-slide link (`HeroSlideLink`) matches that selector but covers
      // the entire slide, so treating it as a control would disable swipe on
      // exactly the slides a shopper is most likely to swipe. It is the slide,
      // not a target within it: let the drag start, and let the
      // `suppressClickUntil` guard below decide whether the release navigates.
      if (control && !control.hasAttribute("data-hero-slide-link")) {
        // Interactive descendants own an ordinary press. Capturing it on the
        // carousel retargets the eventual click and makes dots/CTAs look inert.
        suppressClickUntil.current = 0;
        resetPointer();
        return;
      }
      pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      suppressClickUntil.current = 0;
      // **Never capture a press that began on the whole-slide link.** Capture
      // retargets the eventual CLICK to the capture element, and the browser
      // derives that target from the pointerdown/pointerup pair — so releasing
      // capture on pointerup is already too late. The anchor never sees the
      // click and the slide silently does nothing. Only desktop showed it: a
      // touch's compatibility click is generated from the touch target rather
      // than the captured one, so phones navigated fine while mice did not.
      // The swipe still works from the overlay because these handlers sit on
      // the hero and the events bubble to them; what capture buys is a finger
      // that wanders off the element, and losing that is worth a link that
      // works. (jsdom implements no pointer capture, so only a real browser
      // reproduces this — the guard test stubs the method to keep it honest.)
      if (!control) e.currentTarget.setPointerCapture?.(e.pointerId);
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
        // Expire even when the browser decides not to synthesize a click after
        // the drag; a permanent boolean would swallow the shopper's next real
        // tap on a dot or CTA.
        suppressClickUntil.current = Date.now() + 500;
        go(current + (dx < 0 ? 1 : -1));
      }
    },
    onPointerCancel: resetPointer,
    onLostPointerCapture: resetPointer,
    onClickCapture: (e: { preventDefault: () => void; stopPropagation: () => void }) => {
      if (Date.now() > suppressClickUntil.current) return;
      suppressClickUntil.current = 0;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  return { current, paused, cycle, go, hoverProps, focusProps, swipeProps };
}
