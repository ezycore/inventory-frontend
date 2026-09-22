// coding-standard: maintained
import type { CSSProperties } from "react";
import Link from "next/link";
import type { CatalogCategory, StoreTemplates } from "@/lib/storefront-client";
import { collectionHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { categoryLabelsVisible } from "@/lib/storefront-templates";
import { Media } from "@/components/storefront/sf-bits";
import {
  categoryTileRowLayout,
  type CategoryRowLayout,
  type StripRenderer,
} from "@/components/storefront/home/category-row-layout";

/**
 * Image tiles — a picture per category, in a grid or a scrolling strip. Pure
 * markup shared by the home page's `CategoryTiles` and the Storefront Builder's
 * category-tiles section: the caller decides the mode and the row layout, and
 * brings the scrolling track (`renderStrip`).
 *
 * The quick-commerce pattern (rice, oil, medicine): a shopper recognises a
 * photograph faster than they read a word, and a grocery catalogue has too many
 * departments for a chip row to stay scannable.
 *
 * **Four modes.** `tile` puts the photo on a tinted card with the name beneath;
 * `overlay` runs a taller photo with the name across the bottom of it; `circle`
 * crops that same photo round with the name beneath; `disc` skips photographs
 * entirely for a strip of lettered discs. Which reads better is a question about
 * the merchant's own pictures (product shots vs scenes vs none worth showing).
 *
 * The tint is what stopped this looking like a wireframe. Bare photos on the
 * page background sat in a grid of nothing; `--primary-soft` behind them makes
 * the row read as a deliberate band, and it means the no-image fallback (the
 * category's initial) is a quieter version of the same tile rather than a
 * visibly different object.
 */
export function CategoryTileRow({
  base,
  categories,
  mode,
  row,
  imageFit,
  hideDescription,
  arrows,
  renderStrip,
}: {
  base: string;
  categories: CatalogCategory[];
  mode: StoreTemplates["categoryTiles"];
  row: CategoryRowLayout;
  imageFit: "cover" | "canvas";
  /**
   * Drop the merchant's one-liner and keep the name alone. Unset DRAWS it,
   * which is what the classic home row has always done — so the home page
   * caller, which passes nothing, is unchanged.
   *
   * It is read where `described` is computed rather than only at the tile,
   * because the sentence is what turns a compact tile into a row and what sets
   * the track's height: hiding it at the leaf would leave the row sized for
   * text it no longer draws.
   */
  hideDescription?: boolean;
  /** The strip's paging arrows on a pointer device; unset is on. */
  arrows?: boolean;
  renderStrip: StripRenderer;
}) {
  const overlay = mode === "overlay";

  /* **Has the merchant photographed their departments at all?**
     This decides the row's whole shape, and it is asked ONCE for the section
     rather than per tile — a grid mixing tall photo tiles with short lettered
     ones stretches every row to the tallest and leaves the short ones sitting in
     dead space.

     With photos: a square picture, the name beneath. Without: a small initial
     disc and the name — about a third the height. That second shape is the fix
     for the worst thing this section did, which was to render seven ~200px
     blocks each containing one letter floating in an empty white square, filling
     the entire first screen of a shop that had simply never uploaded a category
     picture. A wayfinding target should not outweigh the products.

     `disc` is that same shape asked for DELIBERATELY rather than fallen back to.
     A marketplace wants a scannable strip of departments above its products even
     when every one of them has a photograph — so the mode wins over the
     photographs rather than the other way round. */
  const photographed = categories.some((c) => !!cardImageUrl(c.image));
  const disc = mode === "disc";
  /* `circle` is the photo modes' round shape. It only survives while there is
     something to photograph: with no pictures at all it degrades to the same
     lettered-disc row `tile` falls back to, because a circle reserving space
     for an image that never comes is the empty-square bug in a rounder frame. */
  const circle = mode === "circle" && photographed;
  const compact = disc || (!photographed && !overlay);
  /* A compact tile carrying a sentence is a ROW, and a 132px track cannot hold
     one. Asked per section for the same reason `photographed` is: one ragged
     grid of mixed shapes is worse than either shape used consistently. */
  /* ⚠ `disc` never turns into a row, even when the merchant HAS written
     descriptions. It is chosen as a scannable strip of departments above the
     products — eight across, a word each — and a sentence per tile turns that
     strip into a stack of three-wide cards that fills the first screen, which is
     the exact failure the compact shape was introduced to fix. The descriptions
     are not lost: they head the collection page each disc leads to. */
  /* `circle` joins `disc` here for the same reason: it is a scannable round
     strip, and a sentence under each circle turns it into a stack of cards. */
  const described =
    !hideDescription &&
    !overlay && !disc && !circle && categories.some((c) => !!c.description?.trim());
  /* Pictures-only is a setting about PICTURES, so the two LETTER shapes are
     never subject to it: a `disc` row has no photographs by definition and a
     `compact` row is the fallback for a catalogue that has none, so dropping
     the names there would leave a row of unexplained initials.

     ⚠ `circle` used to sit in this list and no longer does (2026-09-22, owner's
     request). It is a PHOTO shape — the section only chooses it when something
     is photographed — so a merchant whose round crops speak for themselves can
     drop the captions, exactly as `tile` and `overlay` can. What stays is the
     leaf rule: a circle with no picture of its own still falls through to the
     lettered branch below, and that branch draws its name whatever this says. */
  const labels =
    compact ||
    disc ||
    categoryLabelsVisible(
      row.showLabels,
      categories.every((c) => !!cardImageUrl(c.image)),
    );
  const tileRow = categoryTileRowLayout(
    row,
    overlay ? 150 : disc ? 100 : circle ? 104 : compact && described ? 210 : 96,
    overlay ? 210 : disc ? 150 : circle ? 156 : compact ? (described ? 330 : 132) : 148,
  );

  if (!categories.length) return null;
  const tiles = categories.map((c) => (
    <CategoryTile
      key={c._id}
      href={collectionHref(base, c)}
      name={c.name}
      /* The merchant's own one-liner. `overlay` is the one mode that must not
         draw it — the name already sits on a photograph behind a scrim, and a
         second line of type over an image the merchant chose and we have never
         seen is where legibility runs out. */
      description={hideDescription || overlay || disc || circle ? undefined : c.description}
      image={cardImageUrl(c.image)}
      imageFit={imageFit}
      overlay={overlay}
      compact={compact}
      disc={disc}
      circle={circle}
      strip={tileRow.strip}
      showLabel={labels}
    />
  ));

  /* A department tile is a wayfinding target, not a product. Its visual mode
     supplies a maximum width; the row layout decides grid versus strip, columns
     and alignment. The strip arrives through `renderStrip` rather than as a
     class because its arrows are measured state — see `category-strip.tsx`. */
  return tileRow.strip ? (
    renderStrip({ align: row.align, gap: "var(--gap)", vars: tileRow.style, arrows, children: tiles })
  ) : (
    <div className={tileRow.className} style={tileRow.style}>
      {tiles}
    </div>
  );
}

/**
 * The tile's corners, and the merchant's own answer ahead of them.
 *
 * Two tokens rather than one because a `tile` is two nested boxes — the tinted
 * card and the photograph inside it — and the theme draws them at two different
 * radii. `--sfb-tile-radius` (one px value, from the section's Corner roundness)
 * overrides BOTH, so 0 squares the whole tile rather than leaving a square photo
 * floating on a rounded card.
 *
 * Unset keeps the theme's own tokens, which is what every row drew before the
 * control existed — and what the classic home, which emits no variable, still
 * draws.
 */
const TILE_RADIUS = "var(--sfb-tile-radius, var(--radius-md))";
const CARD_RADIUS = "var(--sfb-tile-radius, var(--radius-lg))";

/**
 * The initial on a plain ground — a half-photographed catalogue still looks
 * deliberate.
 *
 * The ground depends on what it sits ON, and getting that wrong is visible from
 * across the room: inside `tile` mode the card is already `--primary-soft`, so a
 * `--primary-soft` fallback made card and photo-slot merge into one flat blob of
 * brand colour with a letter floating in it. There it takes `--card`, standing
 * in for the white space a photograph would occupy. `overlay` has no card behind
 * it, so the tint is the tile.
 */
function TileFallback({
  name,
  ratio,
  onCard,
}: {
  name: string;
  ratio: string;
  onCard: boolean;
}) {
  return (
    <span
      style={{
        aspectRatio: ratio,
        borderRadius: TILE_RADIUS,
        background: onCard ? "var(--card)" : "var(--primary-soft)",
        color: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--h2)",
        fontWeight: 700,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CategoryTile({
  href,
  name,
  description,
  image,
  imageFit,
  overlay,
  compact,
  disc,
  circle,
  strip,
  showLabel,
}: {
  href: string;
  name: string;
  /** The merchant's one-liner; absent ⇒ the tile draws no second line. */
  description?: string;
  image?: string;
  imageFit: "cover" | "canvas";
  overlay: boolean;
  /** No category in this section has a photo — see `CategoryTileRow`. */
  compact?: boolean;
  /**
   * The merchant CHOSE the disc row (`categoryTiles: "disc"`), rather than it
   * being the fallback for an unphotographed catalogue. Same disc, quieter
   * dress: no card behind it, and the circle takes the neutral panel tint
   * instead of full brand — eight saturated brand pills in a row above the
   * products out-shout the products, which is the opposite of wayfinding.
   */
  disc?: boolean;
  /**
   * `categoryTiles: "circle"` — the photograph cropped round, name beneath. The
   * section only sets it when SOMETHING is photographed; a category that has no
   * picture of its own still falls through to the lettered disc below, which is
   * the same circle at the same size, so the row stays one shape.
   */
  circle?: boolean;
  /** The row layout selected horizontal scrolling. */
  strip: boolean;
  /**
   * False ⇒ the photograph is the whole tile. Decided for the SECTION (see
   * `labels` in `CategoryTileRow`).
   *
   * ⚠ The compact/lettered branch below IGNORES it, and that is not an
   * oversight. A `compact` or `disc` row never receives false — the row forces
   * labels on for both — but a `circle` row now can, and an unphotographed
   * collection inside one falls through to that same branch. A bare initial
   * with no name under it names nothing, so the letter keeps its caption while
   * its photographed neighbours drop theirs.
   */
  showLabel: boolean;
}) {
  const flowStyle = strip
    ? ({ flex: "0 0 var(--tile-max)", width: "var(--tile-max)" } as CSSProperties)
    : undefined;
  /* A disc and a word. No square, no reserved photo slot: there is no photograph
     coming, so holding space for one is what made this section look broken.

     With a description it turns on its side — disc left, name over the line —
     because that is the only shape the sentence fits in, and it is exactly the
     "shop by concern" card a pharmacy wants ("Diabetes / Strips, meters,
     insulin"). Same component, same data, decided by whether the merchant
     actually wrote anything. */
  /* The round photo row. Ahead of `compact` so that a circle WITH a picture
     draws it, and an unphotographed category in the same row falls through to
     the lettered disc — one shape, two fillings. */
  if (circle && image) {
    return (
      <Link
        href={href}
        /* The photograph's `alt` already names it, but it is the LINK's name a
           screen reader reads out in a list of links — so a captionless circle
           carries it here, as the tile and overlay branches do. */
        aria-label={showLabel ? undefined : name}
        style={{
          ...flowStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
        }}
      >
        {/* `radius={999}` rather than a wrapper with `overflow: hidden`: Media
            owns the aspect box and the fit mode, and clipping it from outside
            fights the `canvas` fit (which letterboxes on purpose). */}
        <Media
          src={image}
          alt={name}
          label="category"
          radius={999}
          fit={imageFit}
          ratio="1 / 1"
          style={{ borderRadius: 999 }}
        />
        {showLabel ? (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.25 }}>
            {name}
          </span>
        ) : null}
      </Link>
    );
  }

  if (compact || circle) {
    const row = !!description;
    return (
      <Link
        href={href}
        style={{
          ...flowStyle,
          display: "flex",
          flexDirection: row ? "row" : "column",
          alignItems: "center",
          gap: row ? 13 : 9,
          textAlign: row ? "start" : "center",
          // Chosen disc rows sit on the page itself; the fallback keeps its card,
          // because there it is standing in for a photograph that never came.
          background: disc || circle ? "transparent" : "var(--primary-soft)",
          borderRadius: CARD_RADIUS,
          padding: row ? "14px 15px" : "14px 8px 12px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: disc || circle ? 68 : 42,
            height: disc || circle ? 68 : 42,
            flex: "none",
            borderRadius: 999,
            background: disc || circle ? "var(--surface)" : "var(--primary)",
            /* A deep shade of the brand, mixed toward the page's own ink rather
               than a literal — so it darkens correctly on any surface and in
               dark mode, where a fixed rust would go muddy. */
            color: disc || circle
              ? "color-mix(in srgb, var(--primary) 76%, var(--text))"
              : "var(--on-primary)",
            fontSize: disc || circle ? 26 : 17,
            fontWeight: 700,
            fontFamily: disc || circle ? "var(--font-display)" : undefined,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: row ? 14 : 12.5, fontWeight: row ? 600 : 500, color: "var(--text)", lineHeight: 1.25 }}>
            {name}
          </span>
          {description ? (
            <span style={{ display: "block", fontSize: 12, color: "var(--muted)", lineHeight: 1.35, marginTop: 2 }}>
              {description}
            </span>
          ) : null}
        </span>
      </Link>
    );
  }

  /* The tile's shape, and the merchant's own answer ahead of it.
     ⚠ The fallback behind the variable is the mode's ORIGINAL shape, not one
     shared default: `CategoryTileRow` is drawn by the CLASSIC home too and that
     page sets nothing, so an unset control has to leave each mode exactly as it
     drew before the control existed — square tiles, 3:4 overlays. The variable
     is emitted by the builder sections (`responsiveVars("sfb-tile-ratio", …)`),
     which is also where the phone override lands. */
  const ratio = overlay ? "var(--sfb-tile-ratio, 3 / 4)" : "var(--sfb-tile-ratio, 1 / 1)";
  const media = image ? (
    <Media
      src={image}
      alt={name}
      label="category"
      radius={0}
      fit={imageFit}
      ratio={ratio}
      style={{ borderRadius: TILE_RADIUS }}
    />
  ) : (
    <TileFallback name={name} ratio={ratio} onCard={!overlay} />
  );

  if (overlay) {
    return (
      <Link
        href={href}
        aria-label={showLabel ? undefined : name}
        style={{ ...flowStyle, position: "relative", display: "block", borderRadius: TILE_RADIUS, overflow: "hidden" }}
      >
        {media}
        {/* A scrim, not a translucent bar: the name has to stay legible over a
            photograph the merchant chose and we have never seen, and a gradient
            does that without hiding the third of the picture a solid strip
            would. It goes with the name: the scrim exists to carry that text,
            so leaving it on a pictures-only tile would darken a third of the
            photograph for nothing. */}
        {showLabel ? (
          <span
            style={{
              position: "absolute",
              inset: "auto 0 0 0",
              display: "block",
              padding: "26px 12px 11px",
              background: "linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0))",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            {name}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={showLabel ? undefined : name}
      style={{
        ...flowStyle,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        textAlign: "center",
        background: "var(--primary-soft)",
        borderRadius: CARD_RADIUS,
        padding: 8,
      }}
    >
      {media}
      {showLabel ? (
        <span style={{ paddingBottom: 2 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.3 }}>
            {name}
          </span>
          {description ? (
            <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.3, marginTop: 3 }}>
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
