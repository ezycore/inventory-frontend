// coding-standard: maintained
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

/** Matches Tailwind `gap-1` (0.25rem). */
const DEFAULT_GAP_PX = 4;

interface SingleLineFit {
  /** Attach to the visible row — its client width is the budget. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Attach to the off-screen row holding every item + the overflow chip last. */
  measureRef: RefObject<HTMLDivElement | null>;
  /** How many of `total` items fit on one row, leaving room for the chip. */
  visibleCount: number;
}

/**
 * Counts how many inline items fit on a SINGLE row.
 *
 * A fixed "show N then +X more" cap can't hold one line: item widths vary per
 * dataset (`Tablet` vs `100mg`), so the same N wraps in one card and underfills
 * the next, and cards in a grid end up different heights.
 *
 * The caller renders an off-screen row (`measureRef`) containing all items in
 * source order with the widest possible "+X more" chip as the final child.
 * Widths are read from that row, so the visible row never reflows mid-measure.
 */
export function useSingleLineFit(
  total: number,
  enabled: boolean,
  gap: number = DEFAULT_GAP_PX,
): SingleLineFit {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(total);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const row = measureRef.current;
    if (!container || !row) return;

    const available = container.clientWidth;
    const children = Array.from(row.children) as HTMLElement[];
    // Every item plus the trailing overflow chip must be present to measure.
    if (!available || children.length !== total + 1) return;

    const widths = children.map((child) => child.getBoundingClientRect().width);
    const chipWidth = widths[total];

    let used = 0;
    let count = 0;
    for (let i = 0; i < total; i++) {
      const add = widths[i] + (count > 0 ? gap : 0);
      // Anything but the last item leaves at least one hidden item -> reserve the chip.
      const reserve = i < total - 1 ? gap + chipWidth : 0;
      if (used + add + reserve > available) break;
      used += add;
      count++;
    }

    setVisibleCount(count);
  }, [gap, total]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      setVisibleCount(total);
      return;
    }

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    // Container resize changes the budget; measure-row resize means the item
    // widths themselves moved (late web font, locale swap).
    if (containerRef.current) observer.observe(containerRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, [enabled, measure, total]);

  return { containerRef, measureRef, visibleCount };
}
