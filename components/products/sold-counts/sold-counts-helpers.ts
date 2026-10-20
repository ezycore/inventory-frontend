// coding-standard: maintained
import type { ProductSoldCountRow } from "@/types/api";
import { matchesTaxonomy, type TaxonomyFilter } from "@/components/products/catalog-filters/taxonomy-filter";

/** Rows matching the search box (product name) and the category / sub-category / tag filters. */
export function filterSoldRows(
  rows: ProductSoldCountRow[],
  { search, taxonomy }: { search: string; taxonomy: TaxonomyFilter },
): ProductSoldCountRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter(
    (row) => matchesTaxonomy(row, taxonomy) && (!q || row.productName.toLowerCase().includes(q)),
  );
}

/**
 * The edits worth sending: a row whose number differs from what is saved. A cleared box means 0 —
 * "no opening count" — not "leave it alone", so it saves as 0.
 */
export function soldCountsToSave(
  rows: ProductSoldCountRow[],
  edits: Record<string, number | null>,
): Array<{ productId: string; openingSold: number }> {
  return rows
    .filter((row) => row.productId in edits && (edits[row.productId] ?? 0) !== row.openingSold)
    .map((row) => ({ productId: row.productId, openingSold: edits[row.productId] ?? 0 }));
}
