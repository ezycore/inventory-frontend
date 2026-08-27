"use client";
// coding-standard: maintained
/**
 * The homepage collections row — one tile per listed collection, linking to its
 * collection page.
 *
 * Its shape is a merchant setting (`theme.homeCollections`, Customize → Home
 * page → Collections row) rather than a constant, because the answer depends on how
 * many collections a shop has: five categories read well as a scrolling strip of
 * chips, three look stranded there and want the full row width.
 *
 * - **`strip`** — the original: fixed-width chips, horizontally scrollable, so
 *   any number of collections fits without wrapping. `CategoryStrip` supplies
 *   the track and the arrows that replaced its scrollbar.
 * - **`grid`** — equal columns filling the content width, `columns` per row on
 *   desktop. Narrow screens pin to 2 regardless (see `.sf-home-collections` in
 *   storefront.css): a 6-column grid on a 360px phone is six unreadable slivers,
 *   and inline styles cannot carry a media query.
 *
 * Either shape can drop the names (Customize → Collections row → "Picture
 * only"), but only for a fully photographed catalogue — see
 * `categoryLabelsVisible`.
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
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import {
  categoryLabelsVisible,
  useCategoryRowLayout,
} from "@/components/storefront/home/category-row-layout";
import { CategoryStrip } from "@/components/storefront/home/category-strip";

/**
 * Grid thumb size. The STRIP's sizing is not here — its track width and its
 * thumb are `.sf-chip-row` in storefront.css, because both change on a phone
 * and an inline value cannot carry a breakpoint. A grid column has no such
 * problem: it is already fluid, and a percentage thumb inside one would blow a
 * 60px disc up to 160px on a four-column desktop row.
 */
const THUMB = 60;
/**
 * A nameless thumb leaves a quarter of its track empty and reads as type that
 * failed to load. Without a caption the picture IS the tile, so it takes most
 * of the track back.
 */
const THUMB_BARE = 76;

/**
 * A grid already spans the full content width, so there is no row left to
 * align — `align` positions each tile INSIDE its own column instead, which is
 * what the merchant is actually looking at.
 */
const GRID_ALIGN = { left: "start", center: "center", right: "end" } as const;

export function HomeCollections({
  base,
  categories,
  defaultLayout = "strip",
}: {
  base: string;
  categories: CatalogCategory[];
  /** Section-list default: chips historically strip; tile-led pages use grid. */
  defaultLayout?: "strip" | "grid";
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const { layout, columns, align, showLabels } = useCategoryRowLayout(
    store,
    defaultLayout,
  );

  if (categories.length === 0) return null;

  const grid = layout === "grid";
  const labels = categoryLabelsVisible(
    showLabels,
    categories.every((c) => !!thumbImageUrl(c.image)),
  );
  const tiles = categories.map((c) => (
    <CollectionTile
      key={c._id}
      category={c}
      href={collectionHref(base, c)}
      strip={!grid}
      showLabel={labels}
    />
  ));

  if (!grid) {
    return (
      <CategoryStrip
        align={align}
        // Both come from `.sf-chip-row`, which is also where the phone widens
        // the tile — the gap has to be the same value the width subtracts.
        gap="var(--sf-chip-gap)"
        className={labels ? "sf-chip-row" : "sf-chip-row sf-chip-row--bare"}
      >
        {tiles}
      </CategoryStrip>
    );
  }

  // The grid's own `display`/`gap`/`grid-template-columns` live in the
  // stylesheet, because the column count has to change at a breakpoint and an
  // inline style cannot. The count rides in as a custom property.
  return (
    <div
      className="sf-home-collections"
      style={
        {
          justifyItems: GRID_ALIGN[align],
          "--sf-hc-cols": columns,
        } as CSSProperties
      }
    >
      {tiles}
    </div>
  );
}

function CollectionTile({
  category,
  href,
  strip,
  showLabel,
}: {
  category: CatalogCategory;
  href: string;
  /** A grid column owns its own width; the strip takes it from `.sf-chip-row`. */
  strip: boolean;
  /** False ⇒ the picture is the whole tile. Decided for the row, not here. */
  showLabel: boolean;
}) {
  const imgSrc = thumbImageUrl(category.image);
  /* In the strip the thumb is a PERCENTAGE of its track, so it follows the tile
     when the phone widens it — and 71% of the 84px desktop track is the 60px
     this row has always drawn, which is why desktop does not move. A grid
     column is already fluid, so there the thumb stays the fixed disc. */
  /* A PERCENTAGE radius in the strip, because that box is now 60px on a desktop
     and 90px on a phone: a literal 11px is 18% of the small one and 12% of the
     large one, so the same tile arrives as a soft chip on one and a slab on the
     other. 18% of a square is the desktop corner, held at every size. */
  const thumbSize: CSSProperties = strip
    ? { width: "var(--sf-chip-thumb)", aspectRatio: "1 / 1", borderRadius: "18%" }
    : {
        width: showLabel ? THUMB : THUMB_BARE,
        height: showLabel ? THUMB : THUMB_BARE,
        borderRadius: 11,
      };
  return (
    <Link
      href={href}
      /* The image's own `alt` already names a nameless tile, so this is
         belt-and-braces — but it is the link's name that a screen reader
         announces in a list of links, and that should not depend on which
         branch below drew the picture. */
      aria-label={showLabel ? undefined : category.name}
      style={{
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        width: strip ? "var(--sf-chip)" : undefined,
      }}
    >
      {/* Category image when the merchant set one; initial chip is the fallback. */}
      {imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={category.name}
          style={{ ...thumbSize, objectFit: "cover" }}
        />
      ) : (
        <span
          className="sf-chip-letter"
          style={{
            ...thumbSize,
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
      {showLabel ? (
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
      ) : null}
    </Link>
  );
}
