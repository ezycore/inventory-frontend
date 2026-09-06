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

/**
 * What a section's config PICKS, for the sections that have one.
 *
 * Three kinds, because three different controls answer them and only one of
 * them costs a request: a product row is configured by source and earns a
 * catalogue query per instance; a tag row and a promo-card row are configured by
 * picking from lists the page already has, so they cost nothing extra. That
 * distinction is why this is a kind rather than a boolean — it was two
 * overlapping sets (`CONFIGURABLE` and `TAG_CONFIGURABLE`) until a third
 * section needed a third control, at which point the sets were answering
 * "which editor?" and "does it fetch?" at the same time and agreeing only by
 * accident.
 *
 * A section absent here ignores config entirely.
 */
export type SectionConfigKind = "products" | "tags" | "categories";

const CONFIG_KIND: Record<string, SectionConfigKind> = {
  "featured-grid": "products",
  "product-rail": "products",
  "minimal-picks": "products",
  "tag-chips": "tags",
  "category-banners": "categories",
};

export const sectionConfigKind = (
  type: string,
): SectionConfigKind | undefined => CONFIG_KIND[type];

/** How a `category-banners` card arranges its photograph against its copy. */
export type SectionCardShape = "stacked" | "split";

/**
 * The promo card's composition, with the unset case decided in ONE place.
 *
 * Only an explicit `split` moves the picture beside the copy. Anything else —
 * unset, null, a value from an older payload — is a shop that has never been
 * asked, and it draws the stacked card every row drew before the choice
 * existed. The same rule `resolveHomeCollections` follows, for the same reason:
 * flipping the fallback would restyle every existing homepage without its owner
 * touching anything.
 *
 * Shared because the storefront and the editor must not disagree about what
 * "unset" looks like — the editor's selected pill and the rendered card are the
 * same answer shown twice.
 */
export const resolveCardShape = (
  config: { cardShape?: string | null } | null | undefined,
): SectionCardShape => (config?.cardShape === "split" ? "split" : "stacked");

/**
 * Does this section earn a catalogue fetch? Only a product row does — which is
 * what `configuredSections` walks. A tag or promo-card row renders from data
 * the homepage already loaded, and adding one here would cost every shop that
 * composes it an extra round trip for products it never shows.
 */
export const isConfigurableSection = (type: string) =>
  CONFIG_KIND[type] === "products";

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
 * Fold the config a DEFAULT composition implies under the merchant's own.
 *
 * A preset (and a ready-made theme) may now describe a configured row — "a
 * product grid, sourced newest" — rather than only naming a section type. That
 * implied config has to reach the page exactly the way a stored one does, or
 * the section renders its bare built-in source and the row silently changes
 * meaning.
 *
 * **The merchant's entry always wins.** A default that could overwrite an edit
 * is not a default. The two lists join on `key`, which is safe only because
 * `sectionInstances` mints both halves together — a config keyed by hand would
 * drift from its section and quietly do nothing.
 */
export function mergeSectionConfig(
  implied: readonly StoreSectionConfig[],
  own: readonly StoreSectionConfig[] | undefined,
): StoreSectionConfig[] {
  const mine = own ? [...own] : [];
  if (!implied.length) return mine;
  const claimed = new Set(mine.map((c) => c.key));
  return [...implied.filter((c) => !claimed.has(c.key)), ...mine];
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
  /* A hand-picked row asks for exactly its picks and nothing else. `limit` is
     the picked count, NOT `clampLimit` — that clamps to 4-12, and this list is
     the row's length rather than a pool it draws from, so a merchant who picked
     three would silently get a fourth product they never chose. */
  if (config.source === "manual") {
    const ids = config.productIds ?? [];
    if (ids.length === 0) return null;
    return { ids: ids.join(","), limit: ids.length, inStock: "1" };
  }
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
  // `productIds` is in here for the same reason `categoryId` is: changing the
  // picks changes the products, so a preview matching on the old signature
  // would draw the previous selection under the new one. The CTA fields are
  // deliberately OUT, alongside `title` — re-labelling a button must not throw
  // away products the server already fetched.
  const picks = config.productIds?.join(",") ?? "";
  return `${config.source ?? ""}:${config.categoryId ?? ""}:${clampLimit(config.limit)}:${picks}`;
}

/**
 * Put a hand-picked row's products back into the merchant's order.
 *
 * The query sends ids to `$in`, which returns them in whatever order the index
 * yields — so without this a curated row is a curated SET, and the merchant's
 * lead product lands wherever Mongo felt like putting it. Ordering is the whole
 * difference between a merchant picking eight products and picking a sequence.
 *
 * Products whose id is not in the list keep their relative position at the end,
 * so a non-manual row passed through here is unchanged.
 */
export function orderByIds<T extends { _id: string }>(
  products: T[],
  ids: string[] | undefined,
): T[] {
  if (!ids?.length) return products;
  const rank = new Map(ids.map((id, i) => [id, i]));
  return [...products].sort(
    (a, b) =>
      (rank.get(a._id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b._id) ?? Number.MAX_SAFE_INTEGER),
  );
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
  // A hand-picked row has no source to name itself after, so it keeps the
  // section's own built-in heading until the merchant types one.
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
  /* The RESOLVED config, not `store.sectionConfig` — a preset's implied rows
     are configured rows and must be fetched for like any other. `resolveSections`
     returns the merged list; passing the raw stored one skips them. */
  config: StoreSectionConfig[] | undefined,
  categories: CatalogCategory[],
): { key: string; query: Record<string, string | number> }[] {
  const rows: { key: string; query: Record<string, string | number> }[] = [];
  for (const section of sections) {
    if (!isConfigurableSection(section.type)) continue;
    const own = configFor(config, section.key);
    if (!own) continue;
    const query = sectionQuery(own, categories);
    if (query) rows.push({ key: section.key, query });
  }
  return rows;
}
