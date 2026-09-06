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
 * - **`grid`** — equal columns filling the content width: `columns` per row on
 *   desktop, `mobileColumns` on a phone (2–4, default 2). Two counts rather
 *   than one, because a 6-column desktop row is six unreadable slivers at 360px
 *   and a merchant with fourteen departments still wants more than two across
 *   there. Both ride out as custom properties and the breakpoints in
 *   `.sf-home-collections` pick — an inline style cannot carry a media query.
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
 * Grid thumb size lives in `.sf-home-collections` (storefront.css), NOT here.
 *
 * ⚠ It was two inline constants — 60px captioned, 76px bare — and on a phone
 * that was the row's whole problem. A phone grid is pinned to two columns, so
 * a column is `(390 - 2*12 - 8) / 2 ≈ 179px`, and a 60px picture centred in it
 * filled a third of its track: two specks marooned in white, reading as images
 * that failed to load rather than as a row of departments. The tile row two
 * sections up fills its column, which is exactly the comparison a merchant
 * makes.
 *
 * The original note against a percentage was right about DESKTOP — 71% of a
 * four-column desktop track blows the 60px disc up to ~160px — and wrong to
 * conclude the value could not move at all. It is a custom property now: a
 * fixed disc past the breakpoint, the full column beneath it, which is the same
 * shape of answer `.sf-chip-row` already gives the strip.
 */

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
  const { layout, columns, mobileColumns, align, showLabels } = useCategoryRowLayout(
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
      /* Pictures-only takes a modifier rather than an inline width, for the
         same reason the column count does: the bare thumb is bigger only where
         a caption would otherwise have taken the room, and that is a
         breakpoint's decision. */
      className={
        labels ? "sf-home-collections" : "sf-home-collections sf-home-collections--bare"
      }
      style={
        {
          justifyItems: GRID_ALIGN[align],
          "--sf-hc-cols": columns,
          // The phone's own count — see `mobileColumns`. Independent of the
          // desktop one, because the two divide very different widths.
          "--sf-hc-mcols": mobileColumns,
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
     this row has always drawn, which is why desktop does not move. The grid
     thumb reaches the same place by its own route: a variable the breakpoint
     sets, fixed disc above, full column below. */
  /* A PERCENTAGE radius in the strip, because that box is now 60px on a desktop
     and 90px on a phone: a literal 11px is 18% of the small one and 12% of the
     large one, so the same tile arrives as a soft chip on one and a slab on the
     other. 18% of a square is the desktop corner, held at every size. */
  const thumbSize: CSSProperties = strip
    ? { width: "var(--sf-chip-thumb)", aspectRatio: "1 / 1", borderRadius: "18%" }
    : {
        /* The grid thumb, sized by the row's own breakpoint — see the note at
           the top of this file. A literal corner is wrong once the box grows
           from a 60px disc to a 179px tile, so it takes the theme's own radius
           token, which is what the photo tile beside it already uses. */
        width: "var(--sf-hc-thumb)",
        aspectRatio: "1 / 1",
        borderRadius: "var(--radius-md)",
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
        // The PICTURE is centred in the chip's column; the LABEL under it is
        // left-aligned (below). A centred label under a left-edge-aligned
        // column of tiles gives every name a different starting x, so a row of
        // them has no vertical line for the eye to follow — the names read as
        // scattered rather than as a list. Names also wrap to two lines at
        // different points, and a centred second line hangs under the middle of
        // the first.
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
            // Left, always — see the note on the column above. `alignSelf`
            // because the column itself centres its children, and `width:100%`
            // so the text box fills the chip rather than shrink-wrapping the
            // word (which would re-centre it by the back door).
            alignSelf: "flex-start",
            width: "100%",
            textAlign: "left",
            lineHeight: 1.2,
          }}
        >
          {category.name}
        </span>
      ) : null}
    </Link>
  );
}
