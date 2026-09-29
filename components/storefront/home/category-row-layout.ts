// coding-standard: maintained

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import type { ResolvedHomeCollections } from "@/lib/storefront-templates";
import type { CategoryStrip } from "@/components/storefront/home/category-strip";

/**
 * Layout for the category rows — pure, with no directive and no hooks. The
 * Storefront Builder's server views call these too, and a function exported
 * from a `"use client"` module cannot be called on the server. The
 * Customize-aware hook lives in `use-category-row-layout.ts`.
 */

/** How much of the visible row one arrow press moves. */
const STRIP_PAGE = 0.8;
/** A phone-width track still has to clear a whole tile in one press. */
const STRIP_MIN_STEP = 120;

const GRID_ROW_ALIGN = {
  left: "start",
  center: "center",
  right: "end",
} as const;

export interface CategoryRowLayout extends ResolvedHomeCollections {
  /** Unset keeps a tile theme's original auto-fit grid. */
  columnsExplicit: boolean;
}

/**
 * Draws a scrolling category track: `CategoryStrip` on the home page, its island
 * on a Storefront Builder page, whose server views may not import client code.
 */
export type StripRenderer = (props: ComponentProps<typeof CategoryStrip>) => ReactNode;

/** Distance one arrow press scrolls a strip whose track is `clientWidth` wide. */
export function stripStep(clientWidth: number): number {
  return Math.max(Math.round(clientWidth * STRIP_PAGE), STRIP_MIN_STEP);
}

/**
 * Which of the strip's two arrows have somewhere to go — a row that fits shows
 * neither, and the arrow pointing past the edge you are already at is hidden
 * rather than disabled (they overlay the tiles, so a dead one would sit on top
 * of the first category for no reason).
 *
 * The 1px tolerance is not defensive rounding. Browser zoom and fractional
 * device pixels leave `scrollLeft` resting at values like 0.5 or `max - 0.4`,
 * so an exact comparison keeps one arrow permanently lit at a rest position.
 */
export function stripEdges(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
): { start: boolean; end: boolean } {
  return {
    start: scrollLeft > 1,
    end: scrollLeft < scrollWidth - clientWidth - 1,
  };
}

/**
 * Layout props for the photo/disc category row.
 *
 * `strip` returns the tile variables ALONE — the flex track, its alignment and
 * its scrolling belong to `CategoryStrip`, which owns the arrow state they feed.
 * The variables still ride out on `style` because the strip wrapper puts them on
 * the element the tiles inherit from.
 */
export function categoryTileRowLayout(
  row: CategoryRowLayout,
  tileMin: number,
  tileMax: number,
): {
  className?: string;
  style: CSSProperties;
  strip: boolean;
} {
  const variables = {
    "--tile-min": `${tileMin}px`,
    "--tile-max": `${tileMax}px`,
    /* The PHONE column count, emitted whether or not the merchant set a desktop
       one — the two are independent settings and the phone rule reads only this
       (see `.sf-cat-tiles` in storefront.css). Sent as a reference the
       stylesheet resolves, never as a resolved width, which is the rule that
       keeps a breakpoint able to overrule it. */
    "--sf-ct-mcols": row.mobileColumns,
  } as CSSProperties;

  if (row.layout === "strip") {
    return { style: variables, strip: true };
  }

  return {
    className: row.columnsExplicit
      ? "sf-cat-tiles sf-cat-tiles--controlled"
      : "sf-cat-tiles",
    style: {
      ...variables,
      ...(row.columnsExplicit ? { "--sf-ct-cols": row.columns } : {}),
      "--sf-ct-justify": GRID_ROW_ALIGN[row.align],
    } as CSSProperties,
    strip: false,
  };
}
