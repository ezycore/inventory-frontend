// coding-standard: maintained
import type { ExtractedProduct } from "@/components/sales/types";

/** What the products list knows about a product that the counter's feed doesn't. */
export interface ProductMeta {
  name?: string;
  photo?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
}

/**
 * One tile: a product and every sellable row of it. A product with variants
 * (sizes, gauges…) arrives as one row per variant sharing a `productId`; the
 * tile shows them as one and the picker lists the rows.
 */
export interface PosProductGroup {
  key: string;
  name: string;
  photo?: string;
  categoryId: string;
  subcategoryId?: string;
  rows: ExtractedProduct[];
  minPrice: number;
  maxPrice: number;
  /** Units at this branch, or `null` for a shop that does not count stock. */
  stock: number | null;
}

export interface PosCategory {
  id: string;
  name: string;
  count: number;
  /** A photo from inside the category, to recognise it at a glance. */
  photo?: string;
  subs: { id: string; name: string; count: number }[];
}

/** Products with no category land here. */
export const UNCATEGORIZED = "__uncategorized";

/** A row's own part of the name: "Surgical Gloves - 7.5" → "7.5". */
export function variantLabel(row: ExtractedProduct, productName: string): string {
  const prefix = `${productName} - `;
  return row.label.startsWith(prefix) ? row.label.slice(prefix.length) : row.label;
}

/**
 * Build the browse catalogue from the counter's sellable rows (price, stock —
 * the same list the search box uses) joined to product meta (photo, category)
 * from the products list. Categories come from the products themselves, so a
 * category with nothing in stock at this branch never shows.
 */
export function buildPosCatalog(
  rows: ExtractedProduct[],
  meta: Map<string, ProductMeta>,
  uncategorizedName: string,
): { groups: PosProductGroup[]; categories: PosCategory[] } {
  const groups = new Map<string, PosProductGroup>();

  for (const row of rows) {
    const productId = row.isCombo ? row.comboProductId ?? row.value : row.productId ?? row.value;
    const info = meta.get(productId);
    let group = groups.get(productId);
    if (!group) {
      group = {
        key: productId,
        name: info?.name ?? row.label,
        photo: info?.photo,
        categoryId: info?.categoryId ?? UNCATEGORIZED,
        subcategoryId: info?.subcategoryId,
        rows: [],
        minPrice: row.price,
        maxPrice: row.price,
        stock: row.tracked === false ? null : 0,
      };
      groups.set(productId, group);
    }
    group.rows.push(row);
    group.minPrice = Math.min(group.minPrice, row.price);
    group.maxPrice = Math.max(group.maxPrice, row.price);
    if (group.stock !== null) group.stock += row.availableQuantity;
  }

  const categories = new Map<string, PosCategory>();
  for (const group of groups.values()) {
    const info = meta.get(group.key);
    let category = categories.get(group.categoryId);
    if (!category) {
      category = {
        id: group.categoryId,
        name: info?.categoryName ?? uncategorizedName,
        count: 0,
        photo: group.photo,
        subs: [],
      };
      categories.set(group.categoryId, category);
    }
    category.count += 1;
    category.photo ??= group.photo;
    if (group.subcategoryId) {
      const sub = category.subs.find((s) => s.id === group.subcategoryId);
      if (sub) sub.count += 1;
      else
        category.subs.push({
          id: group.subcategoryId,
          name: info?.subcategoryName ?? group.subcategoryId,
          count: 1,
        });
    }
  }

  const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
  const sortedCategories = [...categories.values()]
    .map((c) => ({ ...c, subs: [...c.subs].sort(byName) }))
    // Named categories alphabetically; the catch-all last.
    .sort((a, b) =>
      a.id === UNCATEGORIZED ? 1 : b.id === UNCATEGORIZED ? -1 : byName(a, b),
    );

  return { groups: [...groups.values()], categories: sortedCategories };
}

export type PosSort = "name" | "priceLow" | "stockLow";

export function sortGroups(groups: PosProductGroup[], sort: PosSort): PosProductGroup[] {
  const sorted = [...groups];
  if (sort === "priceLow") sorted.sort((a, b) => a.minPrice - b.minPrice);
  else if (sort === "stockLow") sorted.sort((a, b) => (a.stock ?? Infinity) - (b.stock ?? Infinity));
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}
