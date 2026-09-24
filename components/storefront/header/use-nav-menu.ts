"use client";
// coding-standard: maintained

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { MenuOpenOn } from "@/lib/storefront-menu";

/**
 * Grace period before a `mouseleave` actually closes the menu. The dropdown's
 * padding bridge fixes the straight-down path; this covers the rest — a fast or
 * diagonal move can have the pointer register outside both boxes for a frame,
 * and re-entering within the delay simply cancels the close.
 */
const CLOSE_DELAY_MS = 140;

/**
 * Which top-level item's dropdown is open.
 *
 * `hover` opens on pointer-enter and focus; `click` only on an explicit click.
 * Either way a click outside the row or Escape closes it — a click-opened panel
 * with no way out but clicking its trigger again is a trap, and a hover one can
 * be left open by a touch that never fires `mouseleave`.
 */
export function useNavMenu(openOn: MenuOpenOn, rowRef: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, rowRef]);

  const show = (i: number) => {
    cancelClose();
    setOpen(i);
  };

  return {
    open,
    show,
    toggle: (i: number) => {
      cancelClose();
      setOpen((o) => (o === i ? null : i));
    },
    /** Pointer entered — `hover` only. */
    enter: (i: number) => {
      if (openOn === "hover") show(i);
      else if (open === i) cancelClose();
    },
    /** Pointer left — `hover` closes after the grace period; `click` waits for a click. */
    leave: (i: number) => {
      if (openOn !== "hover") return;
      cancelClose();
      closeTimer.current = setTimeout(
        () => setOpen((o) => (o === i ? null : o)),
        CLOSE_DELAY_MS,
      );
    },
    /** Focus left the item — no grace period, keyboard moves are deliberate. */
    close: (i: number) => {
      cancelClose();
      setOpen((o) => (o === i ? null : o));
    },
  };
}

/** Room kept at the row's end for the More trigger itself. */
const MORE_WIDTH = 84;

/**
 * How many top links fit on one line before the rest collapse into "More".
 *
 * Measures every item once with all of them rendered, then works from those
 * cached widths on every resize — hiding an item removes it from the layout, so
 * measuring the row as it stands could never grow it back. `signature` changes
 * when the links do (a draft label, a new item), which throws the cache away.
 *
 * Returns `count` itself when `enabled` is false, so the row renders exactly as
 * it did before this setting existed.
 */
export function useNavOverflow(
  rowRef: RefObject<HTMLElement | null>,
  count: number,
  gap: number,
  enabled: boolean,
  signature: string,
): number {
  const [visible, setVisible] = useState(count);
  // Widths belong to one set of links — stored with the signature they were
  // measured for, so a new set is re-measured without touching the ref in render.
  const widths = useRef<{ signature: string; values: number[] } | null>(null);

  // A new set of links: render them all again so they can be measured.
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setVisible(count);
  }

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!enabled || !row) return;

    const fit = () => {
      if (widths.current?.signature !== signature) {
        const items = row.querySelectorAll<HTMLElement>(":scope > [data-nav-item]");
        if (items.length < count) return;
        widths.current = { signature, values: Array.from(items, (el) => el.offsetWidth) };
      }
      const w = widths.current.values;
      const style = getComputedStyle(row);
      const room =
        row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const all = w.reduce((a, b) => a + b, 0) + gap * Math.max(0, w.length - 1);
      if (all <= room) return setVisible(w.length);
      let used = MORE_WIDTH;
      let n = 0;
      while (n < w.length && used + w[n] + gap <= room) {
        used += w[n] + gap;
        n += 1;
      }
      setVisible(Math.max(1, n));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    return () => ro.disconnect();
  }, [rowRef, count, gap, enabled, signature]);

  return enabled ? Math.min(visible, count) : count;
}
