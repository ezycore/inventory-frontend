// coding-standard: maintained
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
  // Heroes — a page uses one.
  "hero-card",
  // Frameless — the copy sits on the page itself. The only hero that lets a
  // themed ground be seen on the first screen.
  "hero-open",
  "hero-split",
  "hero-manifesto",
  "hero-fullbleed",
  "search-hero",
  // Ways into the catalogue.
  "category-chips",
  "category-links",
  "category-tiles",
  // Age, not department. A baby shop's primary facet: a parent shops for
  // "my six-month-old" long before they think about "Feeding".
  "age-chips",
  // Product rows.
  "featured-grid",
  "latest-grid",
  "picks-grid",
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
  "hero-split",
  "hero-manifesto",
  "hero-fullbleed",
  "search-hero",
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
 * The section list each legacy `templates.home` value produces.
 *
 * These three reproduce the pre-registry pages exactly, so a store that has
 * never opened Themes renders as it always did. `templates.home` therefore
 * survives as "which default composition", not as a component switch — and a
 * merchant who reorders sections simply stops using the default.
 */
export const HOME_PRESET_SECTIONS: Record<string, SectionId[]> = {
  classic: ["hero-card", "category-chips", "featured-grid", "latest-grid"],
  "hero-split": ["hero-split", "picks-grid"],
  minimal: ["hero-manifesto", "category-links", "minimal-picks"],
};

/** Merchant-facing names for the Customize → Sections editor. */
export const SECTION_LABELS: Record<SectionId, string> = {
  "hero-card": "Hero card",
  "hero-open": "Open hero (no card)",
  "hero-split": "Split hero",
  "hero-manifesto": "Centred statement",
  "hero-fullbleed": "Full-width photo hero",
  "search-hero": "Search bar hero",
  "category-chips": "Category chips",
  "category-links": "Category links",
  "category-tiles": "Category photo tiles",
  "age-chips": "Shop by age",
  "featured-grid": "Featured products",
  "latest-grid": "New arrivals",
  "picks-grid": "Weekly picks",
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
