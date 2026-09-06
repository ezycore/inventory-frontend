"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type {
  StoreHomeCollections,
  StorefrontStore,
} from "@/lib/storefront-client";
import {
  resolveHomeCollections,
  type ResolvedHomeCollections,
} from "@/lib/storefront-templates";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

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

/** The category-row setting currently visible in Customize, else the saved one. */
export function useCategoryRowLayout(
  store: Pick<StorefrontStore, "theme"> | null | undefined,
  defaultLayout: ResolvedHomeCollections["layout"] = "strip",
): CategoryRowLayout {
  const draft = useSfPreview((s) => s.homeCollections);
  return resolveCategoryRowLayout(
    draft ?? store?.theme?.homeCollections,
    defaultLayout,
  );
}

/** Preserve each section's historical default until the merchant chooses one. */
export function resolveCategoryRowLayout(
  raw: StoreHomeCollections | null | undefined,
  defaultLayout: ResolvedHomeCollections["layout"],
): CategoryRowLayout {
  const resolved = resolveHomeCollections(raw);
  return {
    ...resolved,
    layout:
      raw?.layout === "grid" || raw?.layout === "strip"
        ? resolved.layout
        : defaultLayout,
    columnsExplicit: typeof raw?.columns === "number",
  };
}

/**
 * Does this row draw its category NAMES?
 *
 * Two inputs, and the second is the one that matters: a merchant can ask for a
 * pictures-only row, but a category with no image renders as a letter tile, and
 * a letter with no name under it is not a wayfinding target — it is a mystery
 * box where a department should be. So the preference is honored only when the
 * whole row is photographed.
 *
 * ⚠ **Asked ONCE per section, never per tile.** Keeping the name on just the
 * unphotographed tiles would leave a row of mixed shapes, which is the same
 * mistake `CategoryTiles` already avoids when it asks `photographed` for the
 * whole section rather than tile by tile. One shape used consistently beats a
 * ragged row, even when the consistent one is not what was asked for.
 */
export function categoryLabelsVisible(
  showLabels: boolean,
  allPhotographed: boolean,
): boolean {
  return showLabels || !allPhotographed;
}

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
