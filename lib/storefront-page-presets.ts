// coding-standard: maintained

import type { HomeSectionId } from "@/lib/storefront-home-sections";

/**
 * Ready-made layouts for a single page — the rung between "restyle my whole
 * shop" (a theme) and "set this one dropdown" (the pickers).
 *
 * A merchant who is happy with their store but wants a different-looking
 * category page should not have to know that "products per row" and "loading
 * more products" are the two settings that add up to one. A preset is that
 * bundle, named for the result rather than its parts.
 *
 * **Only two pages have a bundle to make.** Home is `home` + the section order;
 * Collection is `collection` + `pagination`. The product page and checkout are a
 * single setting each, so their existing picker already *is* their page
 * template — wrapping one dropdown in a "preset" would be ceremony, not a
 * feature. Add a page here only when it has a second setting to carry.
 *
 * Presets deliberately do **not** clear `appliedThemeId`: changing one page is
 * drift from the theme, not abandonment of it, and `themeDrift()` already says
 * so honestly.
 */
export interface PagePreset {
  id: string;
  label: string;
  /** One line describing the result, from the shop's side. */
  description: string;
  /** `templates.*` ids this preset sets. Keys absent are left alone. */
  templates: Record<string, string>;
  /** Home only — the section order that completes the look. */
  homepageSections?: HomeSectionId[];
}

export type PagePresetKey = "home" | "collection";

export const PAGE_PRESETS: Record<PagePresetKey, PagePreset[]> = {
  home: [
    {
      id: "marketplace",
      label: "Marketplace",
      description: "Everything on show — categories, featured, then new arrivals",
      templates: { home: "classic" },
      homepageSections: ["hero", "categories", "featured", "latest"],
    },
    {
      id: "storyteller",
      label: "Storyteller",
      description: "One quiet page — a hero, then a short selection",
      templates: { home: "minimal" },
      homepageSections: ["hero", "featured"],
    },
    {
      id: "campaign",
      label: "Campaign",
      description: "Split hero, delivery promises, and two promo tiles",
      templates: { home: "hero-split" },
      homepageSections: ["hero", "trust", "featured", "promo"],
    },
  ],
  collection: [
    {
      id: "browse-fast",
      label: "Browse fast",
      description: "Four per row, more loads as they scroll",
      templates: { collection: "grid-4", pagination: "infinite" },
    },
    {
      id: "considered",
      label: "Considered",
      description: "Three bigger pictures, numbered pages",
      templates: { collection: "grid-3", pagination: "pages" },
    },
    {
      id: "filter-first",
      label: "Filter first",
      description: "Filters pinned beside the grid, Load more button",
      templates: { collection: "sidebar", pagination: "load-more" },
    },
  ],
};

/**
 * Whether the store currently matches a preset exactly — every template id it
 * sets, and its section order where it carries one. A partial match is not a
 * match: the point of highlighting one is to say "this is what you have".
 */
export function isPagePresetActive(
  preset: PagePreset,
  current: {
    templates: Record<string, string>;
    homepageSections: string[] | null;
  },
): boolean {
  for (const [key, value] of Object.entries(preset.templates)) {
    if (current.templates[key] !== value) return false;
  }
  if (!preset.homepageSections) return true;
  return (
    current.homepageSections?.join() === preset.homepageSections.join()
  );
}
