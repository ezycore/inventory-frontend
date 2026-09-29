// coding-standard: maintained
import type { StoreSectionConfig } from "@/lib/storefront-client";

/**
 * The classic home's section VOCABULARY — every id, its merchant-facing label,
 * and the default composition each `templates.home` implies.
 *
 * The classic home that rendered these was deleted on 2026-09-29; every store's
 * home is a builder page now. What remains is catalogue data: the ready-made
 * themes still name their compositions in this vocabulary (`storefront-themes.ts`),
 * and the typed presets keep those names honest.
 */

/** Every section the classic home could compose, in catalogue order. */
export const SECTION_IDS = [
  /* Heroes — a page uses one, and the three are points on ONE axis: how framed.
     `hero-split` (the middle) and `hero-manifesto` (centred, pictureless)
     retired on 2026-09-06; alignment is `theme.heroAlign` now, and a merchant
     choosing between four shades of one decision was not choosing anything.
     `search-hero` went with them — nothing composed it. */
  "hero-card",
  // Frameless — the copy sits on the page itself. The only hero that lets a
  // themed ground be seen on the first screen, and the one that reads
  // `theme.heroAlign`.
  "hero-open",
  "hero-fullbleed",
  /* Ways into the catalogue. `category-links` merged into `category-chips` on
     2026-09-06 — it was the same row drawn quietly, and the treatment is
     `theme.homeCollections.style` now. */
  "category-chips",
  "category-tiles",
  /* A handful of departments advertised as promo cards. NOT a third way to list
     the catalogue — see the note on `CategoryBanners`: the other two are
     wayfinding, this one is merchandising, and the difference is what stops it
     from being a tile row with the type turned up. */
  "category-banners",
  /* A row of TAG chips — a facet the merchant chooses. Called `age-chips`
     until 2026-09-06 and described as a baby-shop section, which is what it was
     built for and never what it does: it renders `sectionConfig.tagIds` and
     takes each label off the tag, so the same row is shop-by-brand,
     shop-by-material or shop-by-occasion. Only the untouched default is an age
     ladder. Nothing stored used the old id, so the rename was free. */
  "tag-chips",
  // Product rows. ONE grid — `latest-grid` and `picks-grid` were the same
  // component drawing from a different fallback list, which `sectionConfig`
  // answers per instance. See `product-sections.tsx`.
  "featured-grid",
  "product-rail",
  "minimal-picks",
  // Full-width bands.
  "trust-band",
  "deal-strip",
  "editorial-split",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/**
 * One entry in a preset's list: a bare id, or an id carrying the config that
 * default composition implies.
 *
 * The object form is what lets a preset say "a product grid, sourced newest"
 * rather than needing a `latest-grid` section type to mean the same thing. The
 * loose structural twin `HomeSectionEntry` in `storefront-templates.ts` is what
 * the resolver takes — this one is the strict, typo-proof form the vocabulary
 * itself is written in.
 */
export type HomePresetEntry =
  | SectionId
  | { type: SectionId; config?: Omit<StoreSectionConfig, "key"> };

/**
 * The section list each legacy `templates.home` value produces.
 *
 * These three reproduce the pre-registry pages exactly, so a store that has
 * never opened Themes renders as it always did. `templates.home` therefore
 * survives as "which default composition", not as a component switch — and a
 * merchant who reorders sections simply stops using the default.
 *
 * ⚠ **A cross-repo contract.** The backend's `convertClassicHome`
 * (`src/services/storefront-home-conversion.ts`) copies these presets, the id
 * list above and the rules each section falls back on, to move a store's home
 * onto the Storefront Builder unchanged. Change one side, change the other.
 */
export const HOME_PRESET_SECTIONS: Record<string, readonly HomePresetEntry[]> = {
  /* The fourth entry IS the retired `latest-grid`, expressed as what it always
     was: a second product grid, sourced newest. This is the reason a preset
     entry can carry config at all — without it, applying Classic would leave
     every shop with two identical Featured rows. */
  classic: [
    "hero-card",
    "category-chips",
    "featured-grid",
    { type: "featured-grid", config: { source: "newest" } },
  ],
  /* The KEY is a `templates.home` value, not a section id — one stored document
     still names it, so it stays and composes the closest surviving hero rather
     than falling through to Classic and silently restyling that shop. */
  "hero-split": ["hero-open", "featured-grid"],
  minimal: ["hero-open", "category-chips", "minimal-picks"],
};
