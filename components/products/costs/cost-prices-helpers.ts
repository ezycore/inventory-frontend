// coding-standard: maintained
import type { ProductCostRow } from "@/types/api";
import { matchesTaxonomy, type TaxonomyFilter } from "@/components/products/catalog-filters/taxonomy-filter";

/** One row per single product and per variant — the key the edits are held under. */
export const costRowKey = (row: Pick<ProductCostRow, "productId" | "variantId">): string =>
  `${row.productId}:${row.variantId ?? ""}`;

/** The rows the filters leave on screen — and the set "Set all shown" applies to. */
export function filterCostRows(
  rows: ProductCostRow[],
  filters: { search: string; taxonomy: TaxonomyFilter; onlyMissing: boolean },
): ProductCostRow[] {
  const needle = filters.search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      matchesTaxonomy(row, filters.taxonomy) &&
      (!filters.onlyMissing || row.costPrice <= 0) &&
      (!needle ||
        row.productName.toLowerCase().includes(needle) ||
        (row.variantName ?? "").toLowerCase().includes(needle)),
  );
}

/**
 * What Save sends: only rows whose cost really changed, and never a cleared field — an empty box
 * means "leave it", not "set ৳0" (a ৳0 cost reads as free goods in every profit figure).
 */
export function costsToSave(
  rows: ProductCostRow[],
  edits: Record<string, number | null>,
): Array<{ productId: string; variantId: string | null; costPrice: number }> {
  return rows.flatMap((row) => {
    const key = costRowKey(row);
    if (!(key in edits)) return [];
    const next = edits[key];
    if (next === null || next === undefined || next === row.costPrice) return [];
    return [{ productId: row.productId, variantId: row.variantId, costPrice: next }];
  });
}

/**
 * The price the item actually sells at: the online shop's price when it differs from the list
 * price (an online price, or a live campaign — the backend's own pricer, shadow test S39), else
 * the list price. The margin is taken here; at the list price a ৳599 cushion selling at ৳450
 * read 65% when it earned 53%.
 */
export const sellingPrice = (row: Pick<ProductCostRow, "price" | "onlinePrice">): number =>
  row.onlinePrice ?? row.price;

/** Whole-percent margin at the selling price, or `null` with no cost or no price to take it at. */
export function marginPercent(
  row: Pick<ProductCostRow, "price" | "onlinePrice">,
  cost: number | null | undefined,
): number | null {
  const price = sellingPrice(row);
  if (!cost || price <= 0) return null;
  return Math.round(((price - cost) / price) * 100);
}
