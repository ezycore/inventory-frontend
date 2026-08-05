// coding-standard: maintained

import type { StoreTemplates } from "@/lib/storefront-client";

/**
 * The homepage section model, with no React in it — the storefront renderer and
 * the admin Customize editor both resolve an order through here, so the page a
 * merchant previews and the page a shopper gets can't drift apart.
 *
 * The id → component map lives beside the components it names
 * (`components/storefront/home/home-sections.ts`); everything here is data.
 */

/**
 * The three styling families a homepage section renders in. This is
 * `templates.home` — it does not select a page, it selects how each section in
 * the order styles itself. Derived from `StoreTemplates` so the union is
 * declared once.
 */
export type HomeVariant = StoreTemplates["home"];

export const HOME_SECTION_IDS = [
  "hero",
  "categories",
  "featured",
  "latest",
  "trust",
  "promo",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

/**
 * Merchant-facing names, written from the shop's side the way
 * `template-options.ts` is — a merchant reorders "New arrivals", not `latest`.
 */
export const HOME_SECTION_LABELS: Record<HomeSectionId, string> = {
  hero: "Hero",
  categories: "Category row",
  featured: "Featured products",
  latest: "New arrivals",
  trust: "Delivery & returns row",
  promo: "Promo tiles",
};

/**
 * What each look rendered before sections existed, in the order it rendered
 * them. These are the fallback when a store has no saved order, so an
 * un-customized shop is byte-for-byte what it was.
 */
export const DEFAULT_SECTION_ORDER: Record<HomeVariant, HomeSectionId[]> = {
  classic: ["hero", "categories", "featured", "latest"],
  "hero-split": ["hero", "trust", "featured", "promo"],
  minimal: ["hero", "categories", "featured"],
};

/**
 * The section ids the backend seeded before this catalogue existed
 * (`HOMEPAGE_SECTION_IDS` = banner/featured/categories/products). Dropping them
 * as unknown would silently delete the hero and the product grid from any store
 * carrying a seeded list, so they alias onto their successors instead.
 */
const LEGACY_SECTION_ALIASES: Record<string, HomeSectionId> = {
  banner: "hero",
  products: "latest",
};

const isKnown = (id: string): id is HomeSectionId =>
  (HOME_SECTION_IDS as readonly string[]).includes(id);

/**
 * Resolve a store's saved section list into renderable ids: aliases applied,
 * unknown ids dropped, duplicates collapsed. An unset — or entirely
 * unrecognised — list falls back to the look's own default order rather than
 * rendering an empty page.
 */
export function resolveHomeSections(
  raw: string[] | null | undefined,
  variant: HomeVariant,
): HomeSectionId[] {
  if (!raw?.length) return DEFAULT_SECTION_ORDER[variant];
  const seen = new Set<HomeSectionId>();
  for (const entry of raw) {
    const id = LEGACY_SECTION_ALIASES[entry] ?? entry;
    if (isKnown(id)) seen.add(id);
  }
  return seen.size > 0 ? [...seen] : DEFAULT_SECTION_ORDER[variant];
}

/** Narrow an arbitrary `templates.home` string to a styling family. */
export const asHomeVariant = (value: string | undefined): HomeVariant =>
  value === "hero-split" || value === "minimal" ? value : "classic";
