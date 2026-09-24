"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";

/** Travel before the direction counts — a thumb's jitter must not flicker the bar. */
const SLACK = 8;

/**
 * `true` while the shopper is scrolling DOWN past `offset`, `false` the moment
 * they scroll back up — the sticky filter bar's hide-on-read, show-on-return
 * behaviour (plan P1 / decision B). Off (`enabled` false) it always answers
 * `false`, so a caller never has to branch.
 */
export function useHideOnScroll(enabled: boolean, offset = 160): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > last + SLACK && y > offset) setHidden(true);
        else if (y < last - SLACK || y <= offset) setHidden(false);
        if (Math.abs(y - last) > SLACK) last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, offset]);
  return enabled && hidden;
}
