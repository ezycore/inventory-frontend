"use client";
// coding-standard: maintained
/**
 * The homepage collections row — one tile per listed collection, linking to its
 * collection page.
 *
 * Its shape is a merchant setting (`theme.homeCollections`, Customize →
 * Collections) rather than a constant, because the right answer depends on how
 * many collections a shop has: five categories read well as a scrolling strip of
 * chips, three look stranded there and want the full row width.
 *
 * - **`strip`** — the original: fixed-width chips, horizontally scrollable, so
 *   any number of collections fits without wrapping.
 * - **`grid`** — equal columns filling the content width, `columns` per row on
 *   desktop. Narrow screens pin to 2 regardless (see `.sf-home-collections` in
 *   storefront.css): a 6-column grid on a 360px phone is six unreadable slivers,
 *   and inline styles cannot carry a media query.
 *
 * Extracted from `home-classic.tsx` when the setting shipped — Classic is the
 * only template that renders the row today, but the layout logic belongs with
 * the row, not with one template that happens to use it.
 */
import type { CSSProperties } from "react";
import Link from "next/link";
import type { CatalogCategory } from "@/lib/storefront-client";
import { collectionHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { resolveHomeCollections } from "@/lib/storefront-templates";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";

/** Tile width in `strip`; the grid lets its column decide instead. */
const STRIP_TILE = 84;
const THUMB = 60;

const STRIP_ALIGN = {
  left: "flex-start",
  // `safe` matters: a centred flex row whose content overflows its scroll box
  // pushes the first item out of reach past the leading edge. `safe` falls back
  // to start-alignment exactly when that would happen.
  center: "safe center",
  right: "safe flex-end",
} as const;

/**
 * A grid already spans the full content width, so there is no row left to
 * align — `align` positions each tile INSIDE its own column instead, which is
 * what the merchant is actually looking at.
 */
const GRID_ALIGN = { left: "start", center: "center", right: "end" } as const;

export function HomeCollections({
  base,
  categories,
}: {
  base: string;
  categories: CatalogCategory[];
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.homeCollections);
  const { layout, columns, align } = resolveHomeCollections(
    draft ?? store?.theme?.homeCollections,
  );

  if (categories.length === 0) return null;

  const grid = layout === "grid";
  // The grid's own `display`/`gap`/`grid-template-columns` live in the
  // stylesheet, because the column count has to change at a breakpoint and an
  // inline style cannot. The count rides in as a custom property.
  const rowStyle = grid
    ? ({
        justifyItems: GRID_ALIGN[align],
        "--sf-hc-cols": columns,
      } as CSSProperties)
    : ({
        display: "flex",
        gap: 11,
        overflowX: "auto",
        paddingBottom: 6,
        justifyContent: STRIP_ALIGN[align],
      } as CSSProperties);

  return (
    <div className={grid ? "sf-home-collections" : undefined} style={rowStyle}>
      {categories.map((c) => (
        <CollectionTile
          key={c._id}
          category={c}
          href={collectionHref(base, c)}
          fixedWidth={grid ? undefined : STRIP_TILE}
        />
      ))}
    </div>
  );
}

function CollectionTile({
  category,
  href,
  fixedWidth,
}: {
  category: CatalogCategory;
  href: string;
  /** Set in `strip` only — a grid column already owns the tile's width. */
  fixedWidth?: number;
}) {
  const imgSrc = thumbImageUrl(category.image);
  return (
    <Link
      href={href}
      style={{
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        width: fixedWidth,
      }}
    >
      {/* Category image when the merchant set one; initial chip is the fallback. */}
      {imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={category.name}
          style={{ width: THUMB, height: THUMB, borderRadius: 11, objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            width: THUMB,
            height: THUMB,
            borderRadius: 11,
            background: "var(--primary-soft)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {category.name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: "var(--text)",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {category.name}
      </span>
    </Link>
  );
}
