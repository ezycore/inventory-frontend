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
  "deals",
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
  deals: "Deals",
  featured: "Featured products",
  latest: "New arrivals",
  trust: "Delivery & returns row",
  promo: "Promo tiles",
};

// Per-template capability and default order moved to
// `lib/storefront-home-templates.ts` when templates gained their own block
// sets — a fixed map here could only describe looks that all offer the same
// blocks, which stopped being true the moment Minimal dropped two of them.

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
 * What a template offers: the ids it implements, and the order it renders them
 * in when the merchant has not reordered. The renderer passes its registry
 * entry; the admin editor passes the same, so the two can never disagree about
 * which blocks a look has.
 */
export interface SectionCapability {
  available: readonly string[];
  defaultOrder: readonly string[];
}

/**
 * Resolve a store's saved section list against the template that will render
 * it: aliases applied, ids the template does not implement dropped, duplicates
 * collapsed. An unset — or entirely unusable — list falls back to the
 * template's own order rather than rendering an empty page.
 */
export function resolveHomeSections(
  raw: string[] | null | undefined,
  template: SectionCapability,
): HomeSectionId[] {
  const fallback = [...template.defaultOrder] as HomeSectionId[];
  if (!raw?.length) return fallback;
  const seen = new Set<HomeSectionId>();
  for (const entry of raw) {
    const id = LEGACY_SECTION_ALIASES[entry] ?? entry;
    if (isKnown(id) && template.available.includes(id)) seen.add(id);
  }
  return seen.size > 0 ? [...seen] : fallback;
}

/**
 * Narrow an arbitrary `templates.home` string to a known template id.
 *
 * **Every new template must be added here.** Omitting one silently resolves it
 * to Classic, and the admin editor would then offer Classic's blocks for a
 * look that does not implement them — a failure typecheck cannot see, because
 * the return type is satisfied either way.
 */
const KNOWN_HOME_TEMPLATES = [
  "classic",
  "hero-split",
  "superstore",
  "lookbook",
  "grocery",
  "minimal",
] as const;

export const asHomeVariant = (value: string | undefined): HomeVariant =>
  (KNOWN_HOME_TEMPLATES as readonly string[]).includes(value ?? "")
    ? (value as HomeVariant)
    : "classic";
