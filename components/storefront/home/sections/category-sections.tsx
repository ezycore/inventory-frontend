"use client";
// coding-standard: maintained

import type { StoreTemplates } from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { pickByIds } from "@/lib/storefront-builder/store-lists";
import { HomeCollections } from "@/components/storefront/home/home-collections";
import { CollectionLinks } from "@/components/storefront/home/collection-tiles";
import { TagChipLinks } from "@/components/storefront/home/tag-chip-links";
import { CategoryTileRow } from "@/components/storefront/home/category-tile-row";
import { CategoryStrip } from "@/components/storefront/home/category-strip";
import { useCategoryRowLayout } from "@/components/storefront/home/use-category-row-layout";
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
 *
 * The markup is shared with the Storefront Builder (`collection-tiles.tsx`,
 * `tag-chip-links.tsx`, `category-tile-row.tsx`); these components read the
 * merchant's home-page settings and the Customize draft.
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
  const bands = configured
    ? pickByIds(tags ?? [], configured)
    : AGE_BANDS.map((name) =>
        tags?.find((tag) => tag.name.toLowerCase() === name.toLowerCase()),
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
      <TagChipLinks base={base} tags={bands} />
    </div>
  );
}

/**
 * The `plain` treatment: quiet centred text links between hairlines.
 *
 * Not a section any more — `CategoryChips` renders it when the merchant sets
 * `homeCollections.style: "plain"`. Kept as its own component because it shares
 * nothing with the tile row but its data: no pictures, no track, no columns.
 */
function CategoryLinkRow({
  base,
  categories,
}: Pick<SectionProps, "base" | "categories">) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(40px,6vw,64px)" }}>
      <CollectionLinks base={base} categories={categories} />
    </div>
  );
}

/**
 * Image tiles — a picture per category, in a grid (`CategoryTileRow`).
 *
 * **Four modes, one section, chosen by `templates.categoryTiles` — never by
 * theme.** Which reads better is a question about the merchant's own pictures,
 * not about which theme they picked, so it is a setting they own.
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
  if (shell === "rail" || !categories.length) return null;

  return (
    <div style={{ ...wrap, padding: "clamp(16px,3vw,28px) var(--pad)" }}>
      <CategoryTileRow
        base={base}
        categories={categories}
        mode={mode}
        row={categoryRow}
        imageFit={imageFit}
        renderStrip={(strip) => <CategoryStrip {...strip} />}
      />
    </div>
  );
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
