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

const STRIP_ALIGN = {
  left: "flex-start",
  // A centred or right-aligned row that overflows must keep its first tile
  // reachable. `safe` falls back to start alignment only in that case.
  center: "safe center",
  right: "safe flex-end",
} as const;

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

/** Shared horizontal-strip behavior for category chips and category tiles. */
export function categoryStripStyle(
  align: ResolvedHomeCollections["align"],
): CSSProperties {
  return {
    display: "flex",
    gap: "var(--gap)",
    overflowX: "auto",
    paddingBottom: 6,
    justifyContent: STRIP_ALIGN[align],
  };
}

/** Layout props for the photo/disc category row. */
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
  } as CSSProperties;

  if (row.layout === "strip") {
    return {
      style: { ...variables, ...categoryStripStyle(row.align) },
      strip: true,
    };
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
