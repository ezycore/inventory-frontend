"use client";
// coding-standard: maintained
/**
 * The scrolling category row — one horizontal track, with arrows instead of a
 * scrollbar.
 *
 * Shared by both catalogue-entry sections, which is why this is a component and
 * not another style helper: Classic's chips (`home-collections.tsx`) and the
 * photo tiles (`sections/category-sections.tsx`) both render the merchant's
 * `layout: "strip"`, and arrow state is behavior, not CSS.
 *
 * **The arrows REPLACE the scrollbar rather than joining it.** `.sf-root` styles
 * a visible 9px bar, so until now the strip's only overflow affordance was raw
 * browser chrome sitting under a row of designed tiles. The track hides it
 * (`.sf-cat-strip-track`) and the arrows carry that message instead.
 *
 * Three rules, each invisible until a particular shop hits it:
 *
 * - **An arrow appears only when it would do something.** Hidden at the edge it
 *   points past, and both hidden when the row does not overflow at all — a shop
 *   with three categories has a strip that fits, and two dead arrows over it
 *   would be the first thing a shopper sees. Overflow is therefore a
 *   measurement (`ResizeObserver` + `onScroll`), never a count of tiles: the
 *   same four categories overflow or don't depending on the window.
 * - **Pointer devices only** (`@media (hover: hover) and (pointer: fine)`, in
 *   the stylesheet). A phone swipes the track natively, and at 360px two 36px
 *   buttons would cover the two tiles it can show. ⚠ This is the INVERSE of
 *   `DealStrip`, whose controls are phone-only — right there because those are
 *   full-width cards a thumb pages through, wrong here.
 * - **One press moves a screenful, not one tile.** Eight presses to reach the
 *   next set would be worse than the scrollbar this replaced.
 *
 * There is deliberately no `tabIndex` on the track. Every tile in it is a link,
 * so a keyboard reaches all of them by tabbing and the browser scrolls each into
 * view on focus; the arrows are real buttons, so they are reachable too. Making
 * the scroll container itself a tab stop would only add one in front of every
 * category row without unlocking anything.
 */
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icon } from "@/components/storefront/sf-icons";
import type { ResolvedHomeCollections } from "@/lib/storefront-templates";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import {
  stripEdges,
  stripStep,
} from "@/components/storefront/home/category-row-layout";

const STRIP_ALIGN = {
  left: "flex-start",
  // A centred or right-aligned row that overflows must keep its first tile
  // reachable. `safe` falls back to start alignment only in that case.
  center: "safe center",
  right: "safe flex-end",
} as const;

export function CategoryStrip({
  align,
  gap,
  vars,
  className,
  trackClassName,
  arrows = true,
  children,
}: {
  align: ResolvedHomeCollections["align"];
  /** Chips run tighter than photo tiles, which take the theme's own rhythm. */
  gap: number | string;
  /** Inherited by the tiles — `--tile-min`/`--tile-max` for the photo row. */
  vars?: CSSProperties;
  /**
   * Extra classes on the wrapper, for a row that needs sizing of its own at a
   * breakpoint — `.sf-chip-row` is the one that does. It goes here rather than
   * in `vars` because an inline custom property outranks every media query, so
   * a value that has to change on a phone cannot travel as a style.
   */
  className?: string;
  /**
   * Classes on the TRACK itself — the scroll container. Needed by a caller
   * whose row is a grid at one breakpoint and a track at the other, which
   * cannot be expressed on the wrapper.
   */
  trackClassName?: string;
  /**
   * Draw the paging arrows at all. Default `true`, which is the behaviour every
   * caller had before this existed.
   *
   * ⚠ Turning it off is not the same as the stylesheet's own rule. That already
   * limits arrows to pointer devices (`hover: hover and pointer: fine`), so a
   * phone never had them; this is the merchant asking for a bare track on the
   * screens that would.
   */
  arrows?: boolean;
  children: ReactNode;
}) {
  const { t } = useStorefrontUI();
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const count = Children.count(children);

  const sync = useCallback(() => {
    const el = track.current;
    if (el) setEdges(stripEdges(el.scrollLeft, el.scrollWidth, el.clientWidth));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    sync();
    /* Whether the row overflows changes with the CONTAINER's width, which no
       scroll event reports — a desktop window dragged narrow is the everyday
       case and the Customize preview's device frames are the other. `count` in
       the deps covers the third trigger: a merchant listing or hiding a
       category while the preview is open. */
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync, count]);

  const page = (direction: -1 | 1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({
      left: direction * stripStep(el.clientWidth),
      // Read per press rather than held in state, matching `HeroCarousel`: the
      // preference can change mid-session and this costs nothing to re-ask.
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <div
      className={className ? `sf-cat-strip ${className}` : "sf-cat-strip"}
      style={vars}
    >
      <div
        ref={track}
        className={
          trackClassName
            ? `sf-cat-strip-track ${trackClassName}`
            : "sf-cat-strip-track"
        }
        style={{ gap, justifyContent: STRIP_ALIGN[align] }}
        onScroll={sync}
      >
        {children}
      </div>
      {arrows && edges.start ? (
        <StripArrow
          edge="start"
          label={t.previousCategories}
          onPress={() => page(-1)}
        />
      ) : null}
      {arrows && edges.end ? (
        <StripArrow
          edge="end"
          label={t.nextCategories}
          onPress={() => page(1)}
        />
      ) : null}
    </div>
  );
}

function StripArrow({
  edge,
  label,
  onPress,
}: {
  edge: "start" | "end";
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      className="sf-cat-strip-arrow"
      data-edge={edge}
      aria-label={label}
      onClick={onPress}
    >
      <Icon name={edge === "start" ? "back" : "chevR"} size={17} />
    </button>
  );
}
