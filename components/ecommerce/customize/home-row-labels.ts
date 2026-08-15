// coding-standard: maintained
/**
 * How a homepage product row describes itself in the admin editor — the
 * collapsed Home part, the panel's row list, and the panel's heading
 * placeholder all read from here so a row cannot be named one thing in the list
 * and another in the field just below it.
 *
 * These are the ADMIN's words. The shopper-facing default heading is
 * `homeRowTitle` in `lib/storefront-home-rows.ts`, which resolves against the
 * storefront dictionary and follows the shopper's language; the two say the
 * same thing in English and must not be collapsed into one function.
 */

import type { StorefrontHomeRow } from "@/types";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";

const collectionName = (
  row: StorefrontHomeRow,
  collections: CollectionRowValue[],
): string | undefined => {
  const found = collections.find((c) => c._id === row.categoryId);
  return found ? found.displayName || found.name : undefined;
};

/** The heading the shop will use when the merchant leaves the field blank. */
export function homeRowDefaultTitle(
  row: StorefrontHomeRow,
  collections: CollectionRowValue[],
): string {
  if (row.source === "featured") return "Featured products";
  if (row.source === "newest") return "New arrivals";
  // A row can sit unfinished in the draft — the source is chosen, the collection
  // is not — so this needs an answer for a row with no collection at all.
  return collectionName(row, collections) ?? "A collection";
}

/** One line under the row's name: where its products come from, and how many. */
export function homeRowSummary(
  row: StorefrontHomeRow,
  collections: CollectionRowValue[],
): string {
  const source =
    row.source === "featured"
      ? "Featured products"
      : row.source === "newest"
        ? "Newest first"
        : (collectionName(row, collections) ?? "No collection picked");
  const size = row.layout === "compact" ? "compact" : "large";
  return `${source} · ${row.limit ?? 8} products · ${size}`;
}
