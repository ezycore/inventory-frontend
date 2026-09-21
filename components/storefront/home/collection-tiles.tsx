// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { CatalogCategory } from "@/lib/storefront-client";
import { collectionHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { categoryLabelsVisible, type ResolvedHomeCollections } from "@/lib/storefront-templates";

/**
 * The collections row's pieces — the tile, the grid that holds tiles, the chip
 * strip's sizing and the plain text-link treatment. Shared by the home page's
 * row (`home-collections.tsx`, `sections/category-sections.tsx`) and the
 * Storefront Builder's collections-row section.
 *
 * Pure markup with no hooks, so a server component can render it. The strip's
 * arrows are the one client part: each caller brings its own `CategoryStrip`
 * (the builder through its island map).
 */

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

/**
 * The strip's gap. It comes from `.sf-chip-row`, which is also where the phone
 * widens the tile — the gap has to be the same value the width subtracts.
 */
export const COLLECTION_STRIP_GAP = "var(--sf-chip-gap)";

/** Chip sizing for the strip; `--bare` lets the picture take a caption's room. */
export const collectionStripClass = (labels: boolean): string =>
  labels ? "sf-chip-row" : "sf-chip-row sf-chip-row--bare";

/** Does the row draw names? Asked once for the whole row — see `categoryLabelsVisible`. */
export const collectionRowLabels = (
  categories: readonly CatalogCategory[],
  showLabels: boolean,
): boolean =>
  categoryLabelsVisible(
    showLabels,
    categories.every((c) => !!thumbImageUrl(c.image)),
  );

/**
 * Collection tiles in equal columns filling the content width.
 *
 * The grid's own `display`/`gap`/`grid-template-columns` live in the
 * stylesheet, because the column count has to change at a breakpoint and an
 * inline style cannot. The counts ride in as custom properties; an unset one
 * keeps the stylesheet's default (4 on a desktop, 2 on a phone).
 */
export function CollectionsGrid({
  align,
  columns,
  mobileColumns,
  bare,
  children,
}: {
  align: ResolvedHomeCollections["align"];
  columns?: number;
  /** The phone's own count — independent of the desktop one, because the two divide very different widths. */
  mobileColumns?: number;
  /**
   * Pictures only. A modifier rather than an inline width, for the same reason
   * the column count is: the bare thumb is bigger only where a caption would
   * otherwise have taken the room, and that is a breakpoint's decision.
   */
  bare: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={bare ? "sf-home-collections sf-home-collections--bare" : "sf-home-collections"}
      style={
        {
          justifyItems: GRID_ALIGN[align],
          "--sf-hc-cols": columns,
          "--sf-hc-mcols": mobileColumns,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function CollectionTile({
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

/**
 * The `plain` treatment: quiet centred text links between hairlines.
 *
 * **On a phone this is the shorter row, which is the point.** The tile grid is
 * pinned to two columns on narrow screens whatever the merchant picked, so a
 * ten-department shop spends five rows of screen on pictures; the same ten
 * names wrap into two or three lines. A quieter row is also a shorter one.
 */
export function CollectionLinks({
  base,
  categories,
}: {
  base: string;
  categories: readonly CatalogCategory[];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 26,
        justifyContent: "center",
        flexWrap: "wrap",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "18px 0",
      }}
    >
      {categories.map((c) => (
        <Link key={c._id} href={collectionHref(base, c)} style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
