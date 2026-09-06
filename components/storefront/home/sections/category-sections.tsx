"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type { CatalogCategory, StoreTemplates } from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { findSectionCategory, resolveCardShape } from "@/lib/storefront-sections";
import { resolveTemplates } from "@/lib/storefront-templates";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { HomeCollections } from "@/components/storefront/home/home-collections";
import {
  categoryLabelsVisible,
  categoryTileRowLayout,
  useCategoryRowLayout,
} from "@/components/storefront/home/category-row-layout";
import { CategoryStrip } from "@/components/storefront/home/category-strip";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/**
 * The category family — three genuinely different answers to "how does a
 * shopper get into the catalogue", not three skins of one.
 *
 * All three render nothing without categories. That rule is per-section rather
 * than in the registry: a section knowing when it has nothing to say is what
 * keeps a reordered page from growing holes.
 */

/**
 * The collections row — every way a shop offers its departments on the home
 * page, in one section.
 *
 * **`category-links` merged in here on 2026-09-06.** It drew the same
 * collections, in the same order, to the same links, in plain text between
 * hairlines — and the difference was a treatment, not a section. Swapping
 * components to get a quieter row also silently discarded the merchant's
 * layout, column and label settings, because those live on
 * `theme.homeCollections` and only the chips row read them.
 *
 * Now it is `homeCollections.style`, and the row keeps everything else it knows
 * about itself.
 */
export function CategoryChips({ base, categories, categoryRowDefault, store }: SectionProps) {
  const row = useCategoryRowLayout(store, categoryRowDefault);
  if (!categories.length) return null;
  if (row.style === "plain") return <CategoryLinkRow base={base} categories={categories} />;
  return (
    /* `StoreHome` stacks sections with no gap between them, so a section's own
       padding is the ONLY thing separating it from the one above. This row's top
       padding was 0, which is fine under a section that ends in whitespace and
       broken under one that ends in a ground: under a full-bleed tinted band
       (it was `search-hero`, retired 2026-09-06; `hero-fullbleed` and the
       campaign strip are the same shape of risk) the tiles sat flush against
       the tint with their top edge touching it, reading as a row clipped by
       the band. Sections are
       merchant-ordered, so "what is above" is not knowable here — the row has to
       carry its own clearance. Matches `CategoryTiles` below, which is the same
       idea drawn as photos and always had it. */
    <div style={{ ...wrap, padding: "clamp(16px,3vw,28px) var(--pad) 8px" }}>
      {/* Layout is the merchant's, so the row itself owns it — home-collections.tsx. */}
      <HomeCollections
        base={base}
        categories={categories}
        defaultLayout={categoryRowDefault}
      />
    </div>
  );
}

/**
 * The FALLBACK age vocabulary, for a shop that has not chosen its own tags.
 *
 * ⚠ **This is a cross-repo contract**, in the same class as the VAT math: it
 * must stay identical to `AGE_BAND_NAMES` in the backend's `seed-data.ts`,
 * which seeds these as tags and as the `Size` variant values. Both sides have a
 * test pinning the literal list; change one, change the other.
 *
 * ⚠ **And it is a fallback, not the mechanism.** Matching tags by NAME is what
 * this section shipped with, and it fails silently in three ways a merchant
 * will actually hit: rename `0-3M` to `0-3 Months` and the chip vanishes,
 * translate the tags to Bangla and the whole row vanishes, add `4-5Y` and it
 * never appears. `sectionConfig.tagIds` is the real answer — ids survive every
 * rename and the chip reads its label off the tag. A seeded `BABY_KIDS_STORE`
 * shop is configured that way at signup, so this path only runs for a merchant
 * who added `tag-chips` to some other theme and has not picked their tags yet.
 *
 * Order is the order a child grows, and that is the only order this row may
 * render in: alphabetical reads "0-3M, 12-18M, 18-24M, 2-3Y, 3-4Y, 3-6M…", so a
 * parent scanning for their baby's age has to read every chip.
 */
export const AGE_BANDS = [
  "Newborn",
  "0-3M",
  "3-6M",
  "6-12M",
  "12-18M",
  "18-24M",
  "2-3Y",
  "3-4Y",
] as const;

/**
 * Shop by age — a baby shop's primary facet.
 *
 * **Tag-backed, not variant-backed, and that is the load-bearing decision.**
 * The age a garment fits is also seeded as the `Size` variant attribute, which
 * is the more "correct" home for it — but the storefront's collection page and
 * the backend's product query have no attribute filter, while `?tags=` is
 * OR-combined and works end to end today. So a chip is a link to a real,
 * already-supported filtered listing rather than a new query path down the
 * stack, and a merchant maintains it the way they maintain every other facet.
 *
 * Renders nothing when the store has no age tags, like every section here: a
 * shop that does not sell by age simply does not compose this one.
 */
export function TagChips({ base, tags, t, config }: SectionProps) {
  /* Configured ids first, in the merchant's own order — an id the store no
     longer has is dropped rather than rendered as a dead chip, which is what
     happens when a tag is deleted after being picked.

     Falls back to name matching ONLY when the merchant has chosen nothing:
     `config?.tagIds` present but empty is a real answer ("show none"), not an
     absent one, so it must not reopen the fallback. */
  const configured = config?.tagIds;
  const bands = (
    configured
      ? configured.map((id) => tags?.find((tag) => tag._id === id))
      : AGE_BANDS.map((name) =>
          tags?.find((tag) => tag.name.toLowerCase() === name.toLowerCase()),
        )
  ).filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
  if (!bands.length) return null;

  return (
    <div style={{ ...wrap, padding: "clamp(16px,3vw,28px) var(--pad) 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* The merchant's own heading wins. Without one the row falls back to
            "Shop by age" — which is honest, because the only tag list this
            section knows by itself IS the age ladder, and a shop that pointed
            it at brands has a heading to type. A generic "Shop by tag" would
            read as unfinished on the shops that never configured it. */}
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0 }}>
          {config?.title?.trim() || t.shopByAge}
        </h2>
      </div>
      {/* Scrolls on a phone rather than wrapping to three ragged rows — eight
          chips is one comfortable swipe and the order carries the meaning. */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "none",
        }}
      >
        {bands.map((tag) => (
          <Link
            key={tag._id}
            href={storeHref(base, `/products?tags=${encodeURIComponent(tag.slug)}`)}
            style={{
              flex: "0 0 auto",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              borderRadius: 999,
              padding: "11px 20px",
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * The `plain` treatment: quiet centred text links between hairlines.
 *
 * Not a section any more — `CategoryChips` renders it when the merchant sets
 * `homeCollections.style: "plain"`. Kept as its own component because it shares
 * nothing with the tile row but its data: no pictures, no track, no columns.
 *
 * **On a phone this is the shorter row, which is the point.** The tile grid is
 * pinned to two columns on narrow screens whatever the merchant picked, so a
 * ten-department shop spends five rows of screen on pictures; the same ten
 * names wrap into two or three lines. A quieter row is also a shorter one.
 */
function CategoryLinkRow({
  base,
  categories,
}: Pick<SectionProps, "base" | "categories">) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(40px,6vw,64px)" }}>
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
    </div>
  );
}

/**
 * Image tiles — a picture per category, in a grid, in one of two presentations.
 *
 * The quick-commerce pattern (rice, oil, medicine): a shopper recognises a
 * photograph faster than they read a word, and a grocery catalogue has too many
 * departments for a chip row to stay scannable.
 *
 * **Four modes, one section, chosen by `templates.categoryTiles` — never by
 * theme.** `tile` puts the photo on a tinted card with the name beneath;
 * `overlay` runs a taller photo with the name across the bottom of it;
 * `circle` crops that same photo round with the name beneath; `disc`
 * skips photographs entirely for a strip of lettered discs. Which reads better
 * is a question about the merchant's own pictures (product shots vs scenes vs
 * none worth showing), not about which theme they picked, so it is a setting
 * they own.
 *
 * The tint is what stopped this looking like a wireframe. Bare photos on the
 * page background sat in a grid of nothing; `--primary-soft` behind them makes
 * the row read as a deliberate band, and it means the no-image fallback (the
 * category's initial) is a quieter version of the same tile rather than a
 * visibly different object.
 */
export function CategoryTiles(props: SectionProps) {
  const { base, categories, store, categoryRowDefault } = props;
  const imageFit = useStoreImageFit();
  const draftMode = useSfPreview((s) => s.categoryTiles);
  const draftShell = useSfPreview((s) => s.shell);
  const categoryRow = useCategoryRowLayout(
    store,
    categoryRowDefault ?? "grid",
  );
  const mode = isTilesMode(draftMode)
    ? draftMode
    : resolveTemplates(store).categoryTiles;
  const overlay = mode === "overlay";

  /* ⚠ **The `rail` shell already lists every department, permanently, down the
     left of this very page.** Drawing them again here put the same seven names
     twice on one screen — the fourth time this storefront has shipped that bug
     (the trust badges twice, the hero photograph twice, the promises twice).
     So the section suppresses itself, which is the existing "a section renders
     nothing when it has nothing to add" rule extended one step: nothing to add
     includes "the shell is already saying it".

     Suppressed rather than removed from the bundle, because the merchant can
     switch the shell back to `stacked` — and then the tiles are the only
     category navigation the home page has. */
  const shell = isShellId(draftShell) ? draftShell : resolveTemplates(store).shell;
  if (shell === "rail") return null;

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
    !overlay && !disc && !circle && categories.some((c) => !!c.description?.trim());
  /* Pictures-only is a setting about PICTURES, so the two letter shapes are
     never subject to it: a `disc` row has no photographs by definition and a
     `compact` row is the fallback for a catalogue that has none, so dropping
     the names there would leave a row of unexplained initials. */
  const labels =
    compact ||
    disc ||
    circle ||
    categoryLabelsVisible(
      categoryRow.showLabels,
      categories.every((c) => !!cardImageUrl(c.image)),
    );
  const tileRow = categoryTileRowLayout(
    categoryRow,
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
      description={overlay || disc || circle ? undefined : c.description}
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

  return (
    <div style={{ ...wrap, padding: "clamp(16px,3vw,28px) var(--pad)" }}>
      {/* A department tile is a wayfinding target, not a product. Its visual
          mode supplies a maximum width; the merchant's shared category-row
          setting decides grid versus strip, columns and alignment. The strip
          arrives as a component rather than a class because its arrows are
          measured state — see `category-strip.tsx`. */}
      {tileRow.strip ? (
        <CategoryStrip
          align={categoryRow.align}
          gap="var(--gap)"
          vars={tileRow.style}
        >
          {tiles}
        </CategoryStrip>
      ) : (
        <div className={tileRow.className} style={tileRow.style}>
          {tiles}
        </div>
      )}
    </div>
  );
}

/**
 * Category promo cards — one to four departments advertised as a block, each
 * with its photograph, its name, the merchant's own line about it, and a button
 * into it.
 *
 * **How this differs from `category-tiles`, which is the question to answer
 * before touching either.** Tiles are WAYFINDING: every department, small,
 * scannable, sized so a row of them never outweighs the products. These are
 * MERCHANDISING: a handful the merchant chose, drawn large enough to sell. That
 * is why the count is capped at four and why the collections are picked rather
 * than listed — a promo block showing all fourteen departments is a tile row
 * with the type turned up.
 *
 * It is also why the description earns its place here and is suppressed on most
 * tile modes: a card this size has room for a sentence, and the sentence is what
 * makes it an advertisement rather than a link.
 *
 * **On a phone it is one card per row, full width** — not two half-width ones.
 * The whole point of the block is that a card is big enough to carry a photo, a
 * line of copy and a button; at 170px it carries none of them, and the shopper
 * gets a worse version of the tile row that already exists two sections up.
 * Page length is the cost, which is what the section's own visibility control is
 * for.
 *
 * **`cardShape` is a composition, and the merchant's pick count is the size.**
 * Two collections fill half the row each, three fill a third — the same model
 * the reference layouts merchants ask for use, and the reason this block never
 * grew a width control. What it was missing was where the picture goes:
 * `stacked` runs it above the copy, `split` sets it beside. Which reads better
 * depends on the merchant's own pictures, not on their theme, so it is theirs
 * to answer — the same argument `templates.categoryTiles` settles for tiles.
 *
 * ⚠ `split` applies from the tablet breakpoint up. **A phone always draws the
 * stacked card**, which is the one-card-per-row premise above applied one level
 * down: half of a 390px card is ~170px per column, and a photograph and a
 * sentence sharing that carries neither. There is no mobile override and
 * deliberately no control for one — the editor states the behaviour instead, so
 * a merchant is told rather than left to discover it. Enforced entirely by
 * `storefront.css` mentioning `--split` only inside its `min-width: 680px`
 * block, so this component never asks about a viewport it cannot see.
 *
 * Renders nothing without categories, like every section in this file.
 */
export function CategoryBanners({ base, categories, config, t }: SectionProps) {
  const imageFit = useStoreImageFit();
  const picked = pickedCategories(categories, config?.categoryIds);
  /* The merchant's composition. Read through the shared resolver rather than
     compared here, so the editor's selected pill and this card can never
     disagree about what an unset value looks like. */
  const split = resolveCardShape(config) === "split";
  if (!picked.length) return null;

  return (
    <div style={{ ...wrap, padding: "clamp(16px,3vw,28px) var(--pad)" }}>
      {config?.title?.trim() ? (
        <SectionTitle>{config.title.trim()}</SectionTitle>
      ) : null}
      <div className="sf-banner-row">
        {picked.map((category) => {
          const image = cardImageUrl(category.image);
          const description = category.description?.trim();
          return (
            <Link
              key={category._id}
              href={collectionHref(base, category)}
              className={split ? "sf-banner-card sf-banner-card--split" : "sf-banner-card"}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              {/* One aspect box for the whole row, whether or not the merchant
                  photographed every collection — a block whose cards are
                  different heights reads as broken rather than as varied.

                  ⚠ The ratio is a CSS variable, not a number chosen here. It is
                  16:9 stacked and 4:3 split, and which one applies depends on
                  the BREAKPOINT as well as the setting — a phone draws the
                  stacked card whatever the merchant picked. A component cannot
                  know the viewport on a server-rendered page, so the value has
                  to live in the stylesheet; see `.sf-banner-card`. */}
              {image ? (
                <Media
                  src={image}
                  alt={category.name}
                  radius={0}
                  fit={imageFit}
                  style={{ aspectRatio: "var(--sf-bc-ratio)" }}
                />
              ) : (
                <span
                  aria-hidden
                  style={{
                    aspectRatio: "var(--sf-bc-ratio)",
                    display: "block",
                    background: "var(--primary-soft)",
                  }}
                />
              )}
              <span className="sf-banner-body">
                <span
                  className="sf-display"
                  style={{
                    display: "block",
                    fontSize: "var(--h2)",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {category.name}
                </span>
                {description ? (
                  /* Two lines, then an ellipsis. The merchant writes this line
                     once and it is printed at four different widths across the
                     block's breakpoints, so a long one has to stop somewhere the
                     card can absorb — the full text heads the collection page
                     this card leads to. */
                  <span className="sf-banner-copy">{description}</span>
                ) : null}
                {/* A BUTTON, not the arrow link every product row ends with.
                    That link is a navigation affordance beside a heading; this
                    is the call to action of an advertisement, and the only
                    thing on the card asking to be pressed. It is a `span`
                    because the whole card is already the anchor — a nested
                    `<a>` is invalid and a second tab stop for the same
                    destination. */}
                <span
                  style={{
                    marginTop: 12,
                    display: "inline-block",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {t.shopNow}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** How many departments the block falls back to before a merchant picks. */
const DEFAULT_BANNER_COUNT = 2;
/** Mirrors `categoryIds` in the backend validator — see the note there. */
const MAX_BANNERS = 4;

/**
 * The collections this block advertises, in the merchant's own order.
 *
 * **Unpicked shows the first two rather than nothing.** A section that renders
 * blank until configured looks broken in the Customize preview at the exact
 * moment the merchant has just added it and is looking for it — the same reason
 * every product row has a built-in source. Two, not four: the block is the
 * merchant's own choice of what to push, and filling it to the brim with
 * whatever sorted first makes it look decided.
 *
 * A pick that no longer resolves is skipped rather than pruned, matching a
 * hand-picked product row: a collection hidden for a week must come back when
 * it returns.
 */
function pickedCategories(
  categories: CatalogCategory[],
  ids: string[] | undefined,
): CatalogCategory[] {
  if (!ids?.length) return categories.slice(0, DEFAULT_BANNER_COUNT);
  return ids
    .map((id) => findSectionCategory(categories, id)?.category)
    .filter((c): c is CatalogCategory => !!c)
    .slice(0, MAX_BANNERS);
}

function isTilesMode(value: unknown): value is StoreTemplates["categoryTiles"] {
  return (
    value === "tile" ||
    value === "overlay" ||
    value === "disc" ||
    value === "circle"
  );
}

function isShellId(value: unknown): value is StoreTemplates["shell"] {
  return value === "stacked" || value === "rail";
}

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
        borderRadius: "var(--radius-md)",
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
  /** No category in this section has a photo — see `CategoryTiles`. */
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
  /** The shared category-row control selected horizontal scrolling. */
  strip: boolean;
  /**
   * False ⇒ the photograph is the whole tile. Decided for the SECTION (see
   * `labels` in `CategoryTiles`), which is also why the compact branch below
   * ignores it — it is a letter shape, and the caller never sends false to one.
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
          borderRadius: "var(--radius-lg)",
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

  const ratio = overlay ? "3 / 4" : "1 / 1";
  const media = image ? (
    <Media
      src={image}
      alt={name}
      label="category"
      radius={0}
      fit={imageFit}
      ratio={ratio}
      style={{ borderRadius: "var(--radius-md)" }}
    />
  ) : (
    <TileFallback name={name} ratio={ratio} onCard={!overlay} />
  );

  if (overlay) {
    return (
      <Link
        href={href}
        aria-label={showLabel ? undefined : name}
        style={{ ...flowStyle, position: "relative", display: "block", borderRadius: "var(--radius-md)", overflow: "hidden" }}
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
        borderRadius: "var(--radius-lg)",
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
