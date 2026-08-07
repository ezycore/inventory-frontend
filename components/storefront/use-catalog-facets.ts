"use client";
// coding-standard: maintained

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useStore,
  useStoreBrands,
  useStoreCategories,
  useStoreTags,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import type { ProductFilters } from "@/components/storefront/filter-panel";
import type { FilterChip } from "@/components/storefront/filter-toolbar";
import type { CatalogSearchParams } from "@/lib/storefront-catalog-params";
import type {
  CatalogCategory,
  StoreBrand,
  StoreTag,
} from "@/lib/storefront-client";

/**
 * The product-facet layer — URL state, facet data, and the active-filter chips —
 * shared by the two pages that filter a catalogue: the collection grid
 * (`/products`, `/{category}/{sub?}`) and search results.
 *
 * **The URL is the single source of truth for every facet.** Header links, panel
 * rows, chips and the drawer therefore all take one code path, and a filtered
 * view is something a shopper can copy, share or reload. Nothing here holds
 * staged state — `setParams` writes the query string and the next render reads
 * it back.
 *
 * Extracted when search gained facets. Before that this was ~150 lines inline in
 * the collection view; a second copy would have drifted on the first change to
 * chip behaviour, and the two pages are precisely the ones a shopper compares.
 */
export interface CatalogFacets {
  /** Facet values in the shape `<FilterPanel>` takes. */
  filters: ProductFilters;
  /** The same values in the shape the request-param builders take (adds `sort`). */
  params: CatalogSearchParams;
  /**
   * Every facet + sort, joined. Two uses, both needing the same string: resetting
   * pagination when the filters change, and keying `<LoadMore>` so a new query
   * gets its own auto-load budget.
   */
  filterKey: string;
  sort: string;
  chips: FilterChip[];
  clearAll: () => void;
  /** Patch the query string; `undefined` or `""` deletes a param. Stable identity. */
  setParams: (patch: Record<string, string | undefined>) => void;
  categories: CatalogCategory[];
  brands: StoreBrand[];
  tags: StoreTag[];
  /** Resolved from the ids, for callers that name the page after its facet. */
  activeCategory?: CatalogCategory;
  activeSubcategory?: CatalogCategory;
  activeBrand?: StoreBrand;
  currency?: string;
}

export function useCatalogFacets({
  categoryPath,
}: {
  /**
   * Set on a category PATH page. There the collection comes from the ROUTE, so
   * the id facets are read as empty and never become chips — a shopper must not
   * be able to filter themselves off the page they are standing on.
   */
  categoryPath?: string;
} = {}): CatalogFacets {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const categoryId = categoryPath ? "" : (sp.get("categoryId") ?? "");
  const subcategoryId = categoryPath ? "" : (sp.get("subcategoryId") ?? "");
  const brandId = sp.get("brandId") ?? "";
  const tags = sp.get("tags") ?? "";
  const minPrice = sp.get("minPrice") ?? "";
  const maxPrice = sp.get("maxPrice") ?? "";
  const inStock = sp.get("inStock") === "1";
  const sort = sp.get("sort") ?? "";

  const { data: store } = useStore(slug);
  const { data: categoryData } = useStoreCategories(slug);
  const { data: brandData } = useStoreBrands(slug);
  const { data: tagData } = useStoreTags(slug);
  const categories = categoryData ?? [];
  const brands = brandData ?? [];
  const tagList = tagData ?? [];
  const currency = store?.currency;

  // Stable so a caller can put it in an effect's dependency list without the
  // effect re-firing every render (the /search page syncs `?q=` that way).
  const setParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const qs = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") qs.delete(k);
        else qs.set(k, v);
      }
      const s = qs.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [sp, pathname, router],
  );

  const activeTagSlugs = tags ? tags.split(",").filter(Boolean) : [];
  const activeCategory = categories.find((c) => c._id === categoryId);
  // The tree is exactly two levels, so a selected child is always on the active
  // parent's `children` — no search across the whole list is needed.
  const activeSubcategory = activeCategory?.children?.find(
    (c) => c._id === subcategoryId,
  );
  const activeBrand = brands.find((b) => b._id === brandId);

  const chips: FilterChip[] = [];
  if (activeCategory)
    chips.push({
      key: "category",
      label: activeCategory.name,
      // Dropping the parent drops the child with it — a `subcategoryId` left
      // behind would keep narrowing the list with nothing on screen saying so.
      onRemove: () =>
        setParams({ categoryId: undefined, subcategoryId: undefined }),
    });
  if (activeSubcategory)
    chips.push({
      key: "subcategory",
      label: activeSubcategory.name,
      // Removing only the child widens back to the parent branch, which is why
      // it is its own chip rather than being folded into the category one.
      onRemove: () => setParams({ subcategoryId: undefined }),
    });
  if (activeBrand)
    chips.push({
      key: "brand",
      label: activeBrand.name,
      onRemove: () => setParams({ brandId: undefined }),
    });
  if (minPrice || maxPrice)
    chips.push({
      key: "price",
      label:
        minPrice && maxPrice
          ? `${money(+minPrice, currency)} – ${money(+maxPrice, currency)}`
          : minPrice
            ? `≥ ${money(+minPrice, currency)}`
            : `≤ ${money(+maxPrice, currency)}`,
      onRemove: () => setParams({ minPrice: undefined, maxPrice: undefined }),
    });
  // One chip per selected tag, each removing only itself — a single "Tags (3)"
  // chip would force the shopper to clear all three to drop one.
  for (const slugValue of activeTagSlugs) {
    const tag = tagList.find((x) => x.slug === slugValue);
    chips.push({
      key: `tag:${slugValue}`,
      label: tag?.name ?? slugValue,
      onRemove: () =>
        setParams({
          tags:
            activeTagSlugs.filter((s2) => s2 !== slugValue).join(",") || undefined,
        }),
    });
  }
  if (inStock)
    chips.push({
      key: "stock",
      label: t.inStockFilter,
      onRemove: () => setParams({ inStock: undefined }),
    });

  const clearAll = () =>
    setParams({
      // `categoryId` is absent on a path page — clearing it there is a no-op,
      // and the collection itself is the route, not a filter to drop.
      categoryId: undefined,
      subcategoryId: undefined,
      brandId: undefined,
      tags: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });

  return {
    filters: {
      categoryId,
      subcategoryId,
      brandId,
      tags,
      minPrice,
      maxPrice,
      inStock,
    },
    params: {
      categoryId,
      subcategoryId,
      brandId,
      tags,
      minPrice,
      maxPrice,
      inStock: inStock ? "1" : "",
      sort,
    },
    filterKey: [
      categoryPath ?? "",
      categoryId,
      subcategoryId,
      brandId,
      tags,
      minPrice,
      maxPrice,
      inStock,
      sort,
    ].join("|"),
    sort,
    chips,
    clearAll,
    setParams,
    categories,
    brands,
    tags: tagList,
    activeCategory,
    activeSubcategory,
    activeBrand,
    currency,
  };
}
