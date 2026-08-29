// coding-standard: maintained
/**
 * Per-section homepage config (`sectionConfig`) turned into something
 * renderable — Customize → Home page → Sections.
 *
 * A product section renders its built-in source until the merchant configures
 * it. Once they do, this module owns the three questions that must be answered
 * IDENTICALLY on the server (SSR) and in the Customize preview (client): which
 * products a section asks the catalogue for, what its heading says, and where
 * "View all" goes.
 *
 * It deliberately does NOT fetch. The server page and the preview use different
 * transports (`lib/storefront-server` vs the client hooks) and only the query is
 * shared — a fetch in here would drag one of them into the other's caching
 * model.
 *
 * The config is a SIBLING of `theme` and never a member of it: applying a
 * ready-made theme replaces `theme.homepageSections` outright, so a merchant's
 * chosen collection stored in there would be erased every time they tried a
 * look. See `StorefrontSectionConfig` on the backend.
 */

import type {
  CatalogCategory,
  StoreHomeSection,
  StoreSectionConfig,
  StorefrontStore,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";

/** Products a section asks for when the merchant hasn't chosen (matches the editor). */
export const DEFAULT_SECTION_LIMIT = 8;
export const MIN_SECTION_LIMIT = 4;
export const MAX_SECTION_LIMIT = 12;

const clampLimit = (n: number | undefined) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(MAX_SECTION_LIMIT, Math.max(MIN_SECTION_LIMIT, Math.round(n)))
    : DEFAULT_SECTION_LIMIT;

/** The section types that read config. Everything else ignores it. */
const CONFIGURABLE = new Set([
  "featured-grid",
  "latest-grid",
  "picks-grid",
  "product-rail",
  "minimal-picks",
]);

export const isConfigurableSection = (type: string) => CONFIGURABLE.has(type);

/**
 * Sections configured by TAG rather than by product source.
 *
 * Deliberately not folded into `CONFIGURABLE`: that set is what
 * `configuredSections` walks to build a product QUERY per row, so an entry
 * there earns a catalogue fetch. `age-chips` renders tags the page already has
 * and needs no query at all — adding it would cost every baby shop an extra
 * round trip for products it never shows.
 */
const TAG_CONFIGURABLE = new Set(["age-chips"]);

export const isTagConfigurableSection = (type: string) =>
  TAG_CONFIGURABLE.has(type);

/** Does this section have a config panel in the editor, of either kind? */
export const hasSectionConfig = (type: string) =>
  isConfigurableSection(type) || isTagConfigurableSection(type);

/**
 * One section's config, by key.
 *
 * **Orphans are ignored, never an error.** An entry whose key has left
 * `homepageSections` simply matches nothing — the backend keeps it on purpose,
 * because a PATCH may carry one array without the other and pruning would
 * delete the config of a section the merchant is halfway through re-adding.
 */
export function configFor(
  config: StoreSectionConfig[] | undefined,
  key: string,
): StoreSectionConfig | undefined {
  return config?.find((c) => c.key === key);
}

/**
 * Find a section's collection in the store's category tree, and say which level
 * it sits at. The tree is exactly two deep and top-level nodes carry
 * `children`, so this needs no extra request — the homepage already has it.
 */
export function findSectionCategory(
  categories: CatalogCategory[],
  categoryId: string | undefined,
): { category: CatalogCategory; isSubcategory: boolean } | null {
  if (!categoryId) return null;
  const top = categories.find((c) => c._id === categoryId);
  if (top) return { category: top, isSubcategory: false };
  for (const parent of categories) {
    const child = parent.children?.find((c) => c._id === categoryId);
    if (child) return { category: child, isSubcategory: true };
  }
  return null;
}

/**
 * The catalogue query one configured section makes. `null` when it cannot
 * resolve — a collection the merchant has since deleted — which the caller
 * renders as no row at all rather than as an empty heading.
 *
 * Two rules are load-bearing:
 *
 * - **`inStock` on every row.** The homepage is a shop window and a card nobody
 *   can buy is dead space in the few slots that decide whether a visitor goes
 *   any further. (Collection and search pages deliberately keep listing
 *   sold-out products — there the shopper is browsing a catalogue.) It keeps
 *   `backorder` products, which sit at zero stock on purpose and still sell.
 * - **`sort: "newest"` is REQUIRED on a `newest` row**, not a tidy-up. The
 *   catalogue's default sort is `{ storefront.featured: -1, createdAt: -1 }` —
 *   featured first — which is right for a collection and wrong for a row headed
 *   "New arrivals": omitting it made the row open with the same products, in
 *   the same order, as the Featured row above it.
 *
 * A `category` row deliberately leaves `sort` unset, taking that featured-first
 * default: the merchant's own picks are exactly what should lead a collection's
 * shop-window row.
 *
 * The level matters because of how products are denormalized — `categoryId` is
 * the TOP-LEVEL category and `subcategoryId` its child. So a top-level row
 * filters on `categoryId` and sweeps in every child's products, while a
 * sub-collection row has to filter on `subcategoryId`; sending a child's id as
 * `categoryId` matches nothing and renders an empty row.
 */
export function sectionQuery(
  config: StoreSectionConfig,
  categories: CatalogCategory[],
): Record<string, string | number> | null {
  const limit = clampLimit(config.limit);
  if (config.source === "featured") return { featured: "true", limit, inStock: "1" };
  if (config.source === "newest") return { limit, sort: "newest", inStock: "1" };
  if (config.source !== "category") return null;
  const found = findSectionCategory(categories, config.categoryId);
  if (!found) return null;
  return found.isSubcategory
    ? { subcategoryId: found.category._id, limit, inStock: "1" }
    : { categoryId: found.category._id, limit, inStock: "1" };
}

/**
 * What a section ASKS FOR, as a string — everything that changes its products,
 * and nothing that doesn't.
 *
 * The Customize preview matches draft sections against the server-rendered ones
 * on this, not on `key`: a merchant who re-points a row from Featured to a
 * collection keeps the same key, and matching on key alone would go on showing
 * the old row's products under the new heading. `title` is absent on purpose —
 * renaming a row must not throw away products the server already fetched.
 */
export function sectionSignature(config: StoreSectionConfig): string {
  return `${config.source ?? ""}:${config.categoryId ?? ""}:${clampLimit(config.limit)}`;
}

/**
 * A configured section's heading. A merchant title wins; blank falls back to
 * wording that follows the SHOPPER's language — the dictionary for the two
 * catalogue-wide sources, and the collection's own name for a category row.
 *
 * A typed title is one string and cannot be translated, which is why blank is
 * the better default rather than a migration that fills every row in.
 */
export function sectionTitle(
  config: StoreSectionConfig,
  t: Dict,
  categories: CatalogCategory[],
  fallback: string,
): string {
  const own = config.title?.trim();
  if (own) return own;
  if (config.source === "featured") return t.featured;
  if (config.source === "newest") return t.newArrivals;
  if (config.source === "category") {
    return findSectionCategory(categories, config.categoryId)?.category.name ?? fallback;
  }
  return fallback;
}

/**
 * Every configured product section on a page, paired with the query it needs —
 * what `shop/page.tsx` fetches in parallel and what the preview joins against.
 *
 * A section whose query is `null` is dropped here rather than fetched: asking
 * with no filter would return the whole catalogue under a heading naming a
 * collection that no longer exists.
 */
export function configuredSections(
  sections: StoreHomeSection[],
  store: Pick<StorefrontStore, "sectionConfig"> | null | undefined,
  categories: CatalogCategory[],
): { key: string; query: Record<string, string | number> }[] {
  const rows: { key: string; query: Record<string, string | number> }[] = [];
  for (const section of sections) {
    if (!isConfigurableSection(section.type)) continue;
    const config = configFor(store?.sectionConfig, section.key);
    if (!config) continue;
    const query = sectionQuery(config, categories);
    if (query) rows.push({ key: section.key, query });
  }
  return rows;
}
