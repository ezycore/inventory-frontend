"use client";

import { RefObject, useEffect, useState } from "react";

interface UseInlineOverflowParams<T extends HTMLElement> {
  /** Container whose width the inline controls must fit within. */
  ref: RefObject<T | null>;
  /**
   * Rendered width of each inline control (px), in render order. Per item, not
   * one number for all of them: a free-text chip is sized to its own
   * placeholder, so assuming a single width packed the row wrong the moment the
   * widths stopped being uniform.
   */
  itemWidths: number[];
  /** Horizontal gap between controls (px). */
  gap: number;
  /** Width reserved inside the container for the Filters button + Reset (px). */
  reserved: number;
}

/**
 * How many items fit, packed in order at their own widths.
 *
 * Exported for its unit test — the hook feeds it a measured container width.
 */
export function packInlineItems(
  usable: number,
  itemWidths: number[],
  gap: number,
): number {
  let used = 0;
  let fit = 0;
  for (const width of itemWidths) {
    const next = used === 0 ? width : used + gap + width;
    if (next > usable) break;
    used = next;
    fit += 1;
  }
  return fit;
}

/**
 * Width-driven overflow: measures the container via ResizeObserver and returns
 * how many of the inline controls fit, packing them in order at their own
 * widths. The remainder is left to the caller to fold into the Advanced panel.
 * Recomputes on every resize.
 */
export function useInlineOverflow<T extends HTMLElement>({
  ref,
  itemWidths,
  gap,
  reserved,
}: UseInlineOverflowParams<T>): number {
  const itemCount = itemWidths.length;
  const [visible, setVisible] = useState(itemCount);
  // The array identity changes every render; the widths themselves rarely do.
  const widthsKey = itemWidths.join(",");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const usable = Math.max(0, el.clientWidth - reserved);
      const fit = packInlineItems(usable, itemWidths, gap);
      setVisible(Math.max(0, Math.min(itemCount, fit)));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, widthsKey, itemCount, gap, reserved]);

  return Math.min(visible, itemCount);
}
