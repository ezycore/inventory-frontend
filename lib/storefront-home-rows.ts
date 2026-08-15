// coding-standard: maintained
/**
 * Homepage product rows — the merchant's `theme.homeRows` turned into something
 * renderable (Customize → Home rows).
 *
 * The homepage used to hard-code two rows, Featured then New arrivals, in
 * `app/(storefront)/shop/page.tsx`. A row is now a merchant-owned record, so
 * this module owns the three questions that used to be answered inline and must
 * stay answered identically on the server (SSR) and in the Customize preview
 * (client): which rows exist, what each one asks the catalogue for, and what its
 * heading says.
 *
 * It deliberately does NOT fetch. The server page and the preview fall back to
 * different transports (`lib/storefront-server` vs the client hooks) and only
 * the query is shared — a fetch in here would drag one of them into the other's
 * caching model.
 */

import type {
  CatalogCategory,
  StoreHomeRow,
  StorefrontStore,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";

/** Products a row asks for when the merchant hasn't chosen (matches the editor). */
export const DEFAULT_ROW_LIMIT = 8;
export const MIN_ROW_LIMIT = 4;
export const MAX_ROW_LIMIT = 12;

/**
 * The most rows a homepage may carry. Mirrors the backend validator's `.max(6)`
 * — each row is one more catalogue query per render, and a shopper who scrolls
 * past six of them has been shown a catalogue, not a shop window.
 */
export const MAX_HOME_ROWS = 6;

/**
 * What a store shows before its owner ever opens the panel: exactly the two
 * rows the homepage hard-coded. Mirrors the backend's `DEFAULT_HOME_ROWS` seed,
 * so a seeded store and a legacy one render the same homepage.
 */
export const DEFAULT_HOME_ROWS: StoreHomeRow[] = [
  { id: "featured", source: "featured", limit: 8, layout: "full" },
  { id: "newest", source: "newest", limit: 8, layout: "compact" },
];

const clampLimit = (n: number | undefined) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(MAX_ROW_LIMIT, Math.max(MIN_ROW_LIMIT, Math.round(n)))
    : DEFAULT_ROW_LIMIT;

/**
 * The rows to render, in order.
 *
 * **Absent and empty are different answers.** `undefined` means the merchant has
 * never touched the panel and gets the built-in pair; `[]` means they cleared
 * every row and must get a homepage with no product rows — falling back there
 * would resurrect rows they deliberately deleted, and no amount of saving would
 * make them go away.
 *
 * A `category` row with no `categoryId` is dropped rather than rendered empty:
 * the editor can hold a half-finished row (the merchant picked the source and
 * has not chosen the collection yet), and the backend rejects it on save, so
 * the only way one reaches here is mid-edit in the preview.
 */
export function resolveHomeRows(
  theme: StorefrontStore["theme"] | null | undefined,
): StoreHomeRow[] {
  const raw = theme?.homeRows ?? DEFAULT_HOME_ROWS;
  return raw
    .filter((r) => r.source !== "category" || !!r.categoryId)
    .slice(0, MAX_HOME_ROWS)
    .map((r) => ({ ...r, limit: clampLimit(r.limit) }));
}

/**
 * What a row ASKS FOR, as a string — everything that changes its products, and
 * nothing that doesn't.
 *
 * The Customize preview matches its draft rows against the server-rendered ones
 * on this, not on `id`: a merchant who re-points a row from Featured to a
 * collection keeps the same id, and matching on id alone would go on showing
 * the old row's products under the new heading. Title and layout are absent on
 * purpose — renaming a row or switching its card size must not throw away
 * products the server already fetched.
 */
export function rowSignature(row: StoreHomeRow): string {
  return `${row.source}:${row.categoryId ?? ""}:${clampLimit(row.limit)}`;
}

/**
 * Find a row's collection in the store's category tree, and say which level it
 * sits at. The tree is exactly two deep and top-level nodes carry `children`,
 * so this needs no extra request — the homepage already has the tree.
 */
export function findRowCategory(
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
 * The catalogue query one row makes. `null` when the row cannot resolve — a
 * collection the merchant has since deleted or hidden — which the caller
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
export function homeRowQuery(
  row: StoreHomeRow,
  categories: CatalogCategory[],
): Record<string, string | number> | null {
  const limit = clampLimit(row.limit);
  if (row.source === "featured") {
    return { featured: "true", limit, inStock: "1" };
  }
  if (row.source === "newest") {
    return { limit, sort: "newest", inStock: "1" };
  }
  const found = findRowCategory(categories, row.categoryId);
  if (!found) return null;
  return found.isSubcategory
    ? { subcategoryId: found.category._id, limit, inStock: "1" }
    : { categoryId: found.category._id, limit, inStock: "1" };
}

/**
 * The row's heading. A merchant title wins; blank falls back to wording that
 * follows the SHOPPER's language — the dictionary for the two built-in sources,
 * and the collection's own (already merchant-facing) name for a category row.
 * A typed title is one string and cannot be translated, which is why blank is
 * the better default rather than a migration that fills every row in.
 */
export function homeRowTitle(
  row: StoreHomeRow,
  t: Dict,
  categories: CatalogCategory[],
): string {
  const own = row.title?.trim();
  if (own) return own;
  if (row.source === "featured") return t.featured;
  if (row.source === "newest") return t.newArrivals;
  return findRowCategory(categories, row.categoryId)?.category.name ?? "";
}
