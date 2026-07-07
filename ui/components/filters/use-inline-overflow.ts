"use client";

import { RefObject, useEffect, useState } from "react";

interface UseInlineOverflowParams<T extends HTMLElement> {
  /** Container whose width the inline controls must fit within. */
  ref: RefObject<T | null>;
  /** Total number of inline-eligible controls. */
  itemCount: number;
  /** Fixed rendered width of each inline control (px). */
  itemWidth: number;
  /** Horizontal gap between controls (px). */
  gap: number;
  /** Width reserved inside the container for the Filters button + Reset (px). */
  reserved: number;
}

/**
 * Width-driven overflow: measures the container via ResizeObserver and returns
 * how many fixed-width inline controls fit. The remainder is left to the caller
 * to fold into the Advanced panel. Recomputes on every resize.
 */
export function useInlineOverflow<T extends HTMLElement>({
  ref,
  itemCount,
  itemWidth,
  gap,
  reserved,
}: UseInlineOverflowParams<T>): number {
  const [visible, setVisible] = useState(itemCount);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const usable = Math.max(0, el.clientWidth - reserved);
      const perItem = itemWidth + gap;
      const fit = perItem > 0 ? Math.floor((usable + gap) / perItem) : itemCount;
      setVisible(Math.max(0, Math.min(itemCount, fit)));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, itemCount, itemWidth, gap, reserved]);

  return Math.min(visible, itemCount);
}
