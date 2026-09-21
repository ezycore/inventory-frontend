// coding-standard: maintained
import type { StoreSectionConfig } from "@/lib/storefront-client";

/**
 * The homepage section VOCABULARY — every id, its merchant-facing label, and
 * the default composition each `templates.home` implies.
 *
 * **Split from the component registry so the SERVER can read it.**
 * `home-sections.tsx` is a `"use client"` module because it imports the section
 * components; importing anything from it on the server throws
 * `Attempted to call isSectionId() from the server but isSectionId is on the
 * client`. The homepage's server render legitimately needs to know which
 * sections a page has — it fetches one query per configured product section
 * before rendering anything — so the ids live here, in a module with no client
 * boundary and no component imports.
 *
 * The two cannot drift: `SECTION_COMPONENTS` is declared as
 * `Record<SectionId, FC<SectionProps>>`, so an id without a component (or a
 * component without an id) is a type error rather than a blank homepage.
 *
 * This also keeps the `lib/` → `components/` direction clean, which
 * `resolveSections` depends on: `lib/` must not import from `components/`.
 */

/**
 * Every section a homepage may compose, in catalogue order.
 *
 * **Adding a section means adding an id here AND a component in
 * `SECTION_COMPONENTS`** — the compiler will not let you do one without the
 * other. Never add a branch inside an existing section instead: a section is
 * shared code any theme may compose, so a fix lands once, while a per-theme
 * variant multiplies every future change by the number of themes.
 */
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

/** Sections whose own component already renders the homepage's primary heading. */
export const HOME_PRIMARY_HEADING_SECTIONS: ReadonlySet<SectionId> = new Set([
  "hero-card",
  "hero-open",
  "hero-fullbleed",
]);

/**
 * Decide where a homepage without a conventional hero gets its one `<h1>`.
 * Editorial split has a real visible headline, so it is promoted when possible;
 * a composition such as Meridian Care with no headline uses the store name in
 * visually-hidden markup instead of inventing visible copy for the merchant.
 */
export function resolveHomePrimaryHeading(
  sections: readonly { key: string; type: string }[],
): { editorialKey?: string; useHiddenStoreName: boolean } {
  if (
    sections.some(
      (section) =>
        isSectionId(section.type) && HOME_PRIMARY_HEADING_SECTIONS.has(section.type),
    )
  ) {
    return { useHiddenStoreName: false };
  }

  const editorial = sections.find((section) => section.type === "editorial-split");
  return editorial
    ? { editorialKey: editorial.key, useHiddenStoreName: false }
    : { useHiddenStoreName: true };
}

const SECTION_ID_SET: ReadonlySet<string> = new Set(SECTION_IDS);

/**
 * Is this a section this build can render?
 *
 * The guard `resolveSections` filters on. A retired id, or one from a newer
 * build, is dropped rather than reaching the dispatch and blowing up the page.
 */
export const isSectionId = (value: unknown): value is SectionId =>
  typeof value === "string" && SECTION_ID_SET.has(value);

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

/**
 * A catalogue-wide source, as a merchant-facing row name.
 *
 * Since the three grids merged, the source is what distinguishes one product
 * grid from another — so it is what names the row wherever a composition is
 * listed: the Sections editor, and the theme picker's running order. Shared
 * rather than written twice, because two lists disagreeing about what the same
 * row is called is exactly how "campaign strip" went wrong.
 *
 * `category` and `manual` are absent on purpose: those rows are named by the
 * collection or the count they carry, which only the editor has to hand.
 */
export const SOURCE_LABELS: Record<string, string> = {
  featured: "Featured products",
  newest: "New arrivals",
};

/** Merchant-facing names for the Customize → Sections editor. */
export const SECTION_LABELS: Record<SectionId, string> = {
  "hero-card": "Hero card",
  "hero-open": "Open hero (no card)",
  "hero-fullbleed": "Full-width photo hero",
  "category-chips": "Collections row",
  "category-tiles": "Category photo tiles",
  "category-banners": "Category promo cards",
  "tag-chips": "Shop by tag",
  /* The label a row falls back to. A CONFIGURED row is named by its content in
     the editor (`sectionLabel`) and by its source on the shop (`sectionTitle`,
     which returns the localized "New arrivals" for a `newest` row) — so this
     names the unconfigured default, not every instance. */
  "featured-grid": "Product grid",
  "product-rail": "Product rail (side-scroll)",
  "minimal-picks": "Selected products",
  "trust-band": "Your promises band",
  /* NOT "campaign strip" — that name belongs to the shell bar under the header
     (Customize → Campaign strip), which is a different component with its own
     colour, size and spacing settings. Two merchant-facing controls reading
     "campaign strip" sent people to the wrong one: style the shell bar green and
     this section stays theme-coloured, with nothing on screen explaining why.
     Named for the heading it actually renders (`t.campaignOffers`). */
  "deal-strip": "Campaign offers row",
  "editorial-split": "Editorial split",
};
