"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/** How far the pointer travels before a press on a handle becomes a drag. */
const DRAG_THRESHOLD = 4;
/** How close to the scroller's edge the pointer must be to scroll it, and how fast. */
const EDGE = 48;
const EDGE_SPEED = 12;

/**
 * Where a row dragged from `from` lands, given the rows' vertical centres
 * measured before the drag and the dragged row's centre now (same coordinates).
 *
 * The answer is an index in the list AFTER the row is taken out — splice
 * semantics, the same `moveSectionTo` uses — so it is simply how many of the
 * other rows sit above the dragged row's centre.
 */
export function dropIndex(centres: readonly number[], from: number, draggedCentre: number): number {
  let index = 0;
  centres.forEach((centre, i) => {
    if (i !== from && centre < draggedCentre) index += 1;
  });
  return index;
}

/** The element that scrolls the list — the editor's rail on a desktop, the page on a phone. */
function scrollerOf(el: HTMLElement): HTMLElement {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

interface DragState {
  /** The row being dragged, by its index when the drag began. */
  from: number;
  /** Where it would land if dropped now — see `dropIndex`. */
  to: number;
  /** How far the row has moved, in px, for its `translateY`. */
  offset: number;
}

/**
 * Drag-to-reorder for a vertical list, by a handle on each row — mouse, touch
 * and keyboard.
 *
 * - **Pointer.** A press on a handle becomes a drag once it moves a few pixels,
 *   so a tap only focuses it. The row follows the pointer (`offset`), the list
 *   shows where it would land (`to`), and the scroller scrolls on its own near
 *   its edges — the rail is a fixed-height box on a desktop, so a long page has
 *   rows out of view. Escape cancels.
 * - **Keyboard.** Arrow up or down on a focused handle moves the row one step,
 *   and focus stays on it because the row keeps its React key.
 *
 * Rows are found as the list's children carrying `data-drag-row`, in order.
 * Pointer events rather than HTML drag and drop, which a phone does not fire.
 */
export function useDragReorder(onMove: (from: number, to: number) => void) {
  const listRef = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  // A drag outlives the render that started it; drop with the caller's latest handler.
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });
  useEffect(() => () => cleanup.current?.(), []);

  const begin = useCallback(
    (from: number, event: PointerEvent<HTMLElement>) => {
      const list = listRef.current;
      if (!list || event.button !== 0) return;
      const rows = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-drag-row]"));
      if (!rows[from]) return;
      const scroller = scrollerOf(list);
      const isPage = scroller === document.scrollingElement || scroller === document.documentElement;
      const startScroll = scroller.scrollTop;
      const startY = event.clientY;
      // Centres in the scroller's content coordinates, so scrolling mid-drag cannot move them.
      const centres = rows.map((row) => {
        const rect = row.getBoundingClientRect();
        return rect.top + rect.height / 2 + startScroll;
      });
      let pointerY = startY;
      let active = false;
      let frame = 0;
      let current: DragState | null = null;

      const tick = () => {
        const edges = isPage
          ? { top: 0, bottom: window.innerHeight }
          : scroller.getBoundingClientRect();
        if (pointerY < edges.top + EDGE) scroller.scrollTop -= EDGE_SPEED;
        else if (pointerY > edges.bottom - EDGE) scroller.scrollTop += EDGE_SPEED;
        const offset = pointerY + scroller.scrollTop - (startY + startScroll);
        const to = dropIndex(centres, from, centres[from] + offset);
        if (!current || current.offset !== offset || current.to !== to) {
          current = { from, to, offset };
          setDrag(current);
        }
        frame = requestAnimationFrame(tick);
      };

      const onPointerMove = (move: globalThis.PointerEvent) => {
        pointerY = move.clientY;
        if (!active && Math.abs(pointerY - startY) > DRAG_THRESHOLD) {
          active = true;
          document.body.style.userSelect = "none";
          frame = requestAnimationFrame(tick);
        }
      };
      const end = (commit: boolean) => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
        window.removeEventListener("keydown", onKeyDown);
        document.body.style.userSelect = "";
        cleanup.current = null;
        setDrag(null);
        if (commit && current && current.to !== current.from) onMoveRef.current(current.from, current.to);
      };
      const onPointerUp = () => end(active);
      const onPointerCancel = () => end(false);
      const onKeyDown = (key: globalThis.KeyboardEvent) => {
        if (key.key === "Escape") end(false);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
      window.addEventListener("keydown", onKeyDown);
      cleanup.current = () => end(false);
    },
    [],
  );

  /** Spread on each row's handle — a `<button>`, so it is reachable by keyboard. */
  const handleProps = (index: number, count: number) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => begin(index, event),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const to = event.key === "ArrowUp" ? index - 1 : event.key === "ArrowDown" ? index + 1 : null;
      if (to === null) return;
      event.preventDefault();
      if (to >= 0 && to < count) onMoveRef.current(index, to);
    },
    // Without it a phone scrolls the page instead of starting the drag.
    style: { touchAction: "none" as const },
  });

  return { listRef, drag, handleProps };
}
