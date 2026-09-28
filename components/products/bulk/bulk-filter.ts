// coding-standard: maintained
import type { ProductBulkFilter, ProductBulkTarget } from "@/services/api/modules/products/api";
import type { BulkSelection } from "@/types/DataTable";

const FILTER_KEYS = ["search", "categoryId", "subcategoryId", "brandId", "status"] as const;

/**
 * The products table's filter state → the strict filter `/products/bulk-update`
 * accepts. Empty values are dropped (an empty `search` is "no search", not "name
 * equals nothing"), and `tags` is normalised to an array whether the filter bar
 * holds it as an array or the URL handed it over as `a,b`.
 */
export const toBulkFilter = (filters: Record<string, unknown>): ProductBulkFilter => {
  const out: ProductBulkFilter = {};
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  const tags = filters.tags;
  const tagList = (Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  if (tagList.length) out.tags = tagList;
  return out;
};

/** What a bulk selection points the server at. */
export const toBulkTarget = (selection: BulkSelection): ProductBulkTarget =>
  selection.allMatching
    ? { filter: toBulkFilter(selection.filters) }
    : { ids: selection.ids };
