"use client";
// coding-standard: maintained

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useStore,
  useStoreCategories,
  useStoreFacets,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { money } from "@/components/storefront/format";
import type { FilterChip } from "@/components/storefront/filter-toolbar";
import {
  catalogPage,
  optionParams,
  type CatalogSearchParams,
} from "@/lib/storefront-catalog-params";
import {
  listParam,
  optionGroupId,
  optionParam,
  readOptionParams,
  tagGroupId,
  toggleInList,
} from "@/lib/storefront-filters";
import type {
  CatalogCategory,
  StoreBrand,
  StoreFacets,
} from "@/lib/storefront-client";

const NO_FACETS: StoreFacets = {
  total: 0,
  categories: [],
  brands: [],
  tags: [],
  options: [],
  price: { min: null, max: null, presets: [] },
  anyOutOfStock: false,
};

/** Active product-list filters, straight from the URL ("" / [] / false = unset). */
export interface ProductFilters {
  categoryId: string;
  /** A child of `categoryId`; "" = the whole parent branch. */
  subcategoryId: string;
  /** Selected brand ids, OR-combined. */
  brandIds: string[];
  /** Selected tag slugs, OR-combined — across every tag group. */
  tags: string[];
  /** Selected option values per attribute, as named in the URL (`{ Size: ["M"] }`). */
  options: Record<string, string[]>;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

/** Patch of query params; `undefined` deletes the param (single code path with the URL). */
export type FilterPatch = Record<string, string | undefined>;

/**
 * The product-facet layer — URL state, facet data, and the active-filter chips —
 * shared by every page that filters a catalogue: the collection grid
 * (`/products`, `/{category}/{sub?}`), campaign pages and search results.
 *
 * **The URL is the single source of truth for every facet.** Header links, panel
 * rows, chips and the sheet therefore all take one code path, and a filtered
 * view is something a shopper can copy, share or reload. Nothing here holds
 * staged state — `setParams` writes the query string and the next render reads
 * it back.
 *
 * Facet DATA comes from one request (`GET …/facets`), which counts every facet
 * against the others — see the backend `storefront-facets.service.ts`.
 */
export interface CatalogFacets {
  filters: ProductFilters;
  /** The same values in the shape the request-param builders take (adds `sort`). */
  params: CatalogSearchParams;
  /**
   * Every facet + sort, joined. Two uses, both needing the same string: resetting
   * pagination when the filters change, and keying `<LoadMore>` so a new query
   * gets its own auto-load budget.
   */
  filterKey: string;
  /** The sort in force — the URL's, else the merchant's default. */
  sort: string;
  /** Pick a sort; the merchant's default is written as no param at all. */
  setSort: (sort: string) => void;
  /**
   * The 1-based page cursor, read from `?page=`. In the URL rather than state so
   * the browser restores it — a shopper returning from a product lands where
   * they were.
   */
  page: number;
  /** Move the cursor. Page 1 drops the param rather than writing `?page=1`. */
  setPage: (page: number) => void;
  chips: FilterChip[];
  clearAll: () => void;
  /**
   * Patch the query string; `undefined` or `""` deletes a param. Stable identity.
   * **Always resets the cursor to page 1** — page 3 of the old filter is usually
   * past the end of the new one.
   */
  setParams: (patch: FilterPatch) => void;
  /** Flip one value in a comma-list param (`brandId`, `tags`, `opt.*`). */
  toggle: (param: string, value: string) => void;
  categories: CatalogCategory[];
  /** Counts, brands, tags, options, price spread — for the current result set. */
  data: StoreFacets;
  /** Group ids carrying a value right now — always open, never hidden. */
  activeGroups: Set<string>;
  /** Set on a category PATH page — the collection is the route there, not a filter. */
  categoryPath?: string;
  /** Resolved from the ids, for callers that name the page after its facet. */
  activeCategory?: CatalogCategory;
  activeSubcategory?: CatalogCategory;
  /** The one selected brand, when exactly one is — a brand page's heading. */
  activeBrand?: StoreBrand;
  currency?: string;
}

export function useCatalogFacets({
  categoryPath,
  campaign,
  defaultSort = "featured",
}: {
  /**
   * Set on a category PATH page. There the collection comes from the ROUTE, so
   * the id facets are read as empty and never become chips — a shopper must not
   * be able to filter themselves off the page they are standing on.
   */
  categoryPath?: string;
  /** A campaign page's slug — scopes the facets to the sale's own products. */
  campaign?: string;
  /** The merchant's default sort — see `CatalogSearchParams.defaultSort`. */
  defaultSort?: string;
} = {}): CatalogFacets {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const pathname = useStorePathname();
  const sp = useSearchParams();

  const categoryId = categoryPath ? "" : (sp.get("categoryId") ?? "");
  const subcategoryId = categoryPath ? "" : (sp.get("subcategoryId") ?? "");
  const brandId = sp.get("brandId") ?? "";
  const q = sp.get("q") ?? "";
  const tags = sp.get("tags") ?? "";
  const minPrice = sp.get("minPrice") ?? "";
  const maxPrice = sp.get("maxPrice") ?? "";
  const inStock = sp.get("inStock") === "1";
  const urlSort = sp.get("sort") ?? "";
  const page = catalogPage(sp.get("page"));
  const optRaw = useMemo(() => optionParams(sp.entries()), [sp]);
  const options = useMemo(() => readOptionParams(sp), [sp]);

  const { data: store } = useStore(slug);
  const { data: categoryData } = useStoreCategories(slug);
  const { data: facetData } = useStoreFacets(slug, {
    q,
    campaign,
    categoryPath,
    categoryId,
    subcategoryId,
    brandId,
    tags,
    minPrice,
    maxPrice,
    inStock: inStock ? "1" : "",
    ...optRaw,
  });
  const categories = categoryData ?? [];
  const data = facetData ?? NO_FACETS;
  const currency = store?.currency;

  // `replace`, not `push`, for every write here: filters and the page cursor are
  // one view of one page, and pushing would bury the page the shopper arrived
  // from under a dozen entries they'd have to walk back through.
  const writeQuery = useCallback(
    (
      mutate: (qs: URLSearchParams) => void,
      { scroll }: { scroll: boolean } = { scroll: false },
    ) => {
      const qs = new URLSearchParams(sp.toString());
      mutate(qs);
      const s = qs.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll });
    },
    [sp, pathname, router],
  );

  const setParams = useCallback(
    (patch: FilterPatch) => {
      writeQuery((qs) => {
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "") qs.delete(k);
          else qs.set(k, v);
        }
        // A new result set starts at its own first page.
        qs.delete("page");
      });
    },
    [writeQuery],
  );

  const toggle = useCallback(
    (param: string, value: string) =>
      setParams({ [param]: toggleInList(listParam(sp.get(param) ?? ""), value) }),
    [setParams, sp],
  );

  const setSort = (next: string) =>
    setParams({ sort: next === defaultSort ? undefined : next });

  const setPage = useCallback(
    (next: number) => {
      // Scrolls, unlike every other write here: the grid above the pager has
      // been replaced wholesale.
      writeQuery(
        (qs) => {
          if (next > 1) qs.set("page", String(next));
          else qs.delete("page");
        },
        { scroll: true },
      );
    },
    [writeQuery],
  );

  const brandIds = listParam(brandId);
  const tagSlugs = listParam(tags);
  const activeCategory = categories.find((c) => c._id === categoryId);
  // The tree is exactly two levels, so a selected child is always on the active
  // parent's `children`.
  const activeSubcategory = activeCategory?.children?.find((c) => c._id === subcategoryId);
  const activeBrand =
    brandIds.length === 1 ? data.brands.find((b) => b._id === brandIds[0]) : undefined;

  const chips: FilterChip[] = [];
  if (activeCategory)
    chips.push({
      key: "category",
      label: activeCategory.name,
      // Dropping the parent drops the child with it.
      onRemove: () => setParams({ categoryId: undefined, subcategoryId: undefined }),
    });
  if (activeSubcategory)
    chips.push({
      key: "subcategory",
      label: activeSubcategory.name,
      onRemove: () => setParams({ subcategoryId: undefined }),
    });
  // One chip per value, each removing only itself — a single "Brands (3)" chip
  // would force the shopper to clear all three to drop one.
  for (const id of brandIds) {
    const brand = data.brands.find((b) => b._id === id);
    chips.push({
      key: `brand:${id}`,
      label: brand?.name ?? t.brandLabel,
      onRemove: () => toggle("brandId", id),
    });
  }
  for (const [name, values] of Object.entries(options)) {
    for (const value of values) {
      chips.push({
        key: `opt:${name}:${value}`,
        label: `${name}: ${value}`,
        onRemove: () => toggle(optionParam(name), value),
      });
    }
  }
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
  for (const slugValue of tagSlugs) {
    const tag = data.tags.find((x) => x.slug === slugValue);
    chips.push({
      key: `tag:${slugValue}`,
      label: tag?.name ?? slugValue,
      onRemove: () => toggle("tags", slugValue),
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
      ...Object.fromEntries(Object.keys(optRaw).map((k) => [k, undefined])),
    });

  const activeGroups = new Set<string>();
  if (categoryId) activeGroups.add("category");
  if (brandIds.length) activeGroups.add("brand");
  if (minPrice || maxPrice) activeGroups.add("price");
  if (inStock) activeGroups.add("availability");
  for (const name of Object.keys(options)) {
    // The URL may spell the attribute in any case; the group id uses the
    // facets' own spelling.
    const own = data.options.find((o) => o.name.toLowerCase() === name.toLowerCase());
    activeGroups.add(optionGroupId(own?.name ?? name));
  }
  for (const slugValue of tagSlugs) {
    const group = data.tags.find((x) => x.slug === slugValue)?.group;
    activeGroups.add(group ? tagGroupId(group) : "tags");
  }

  const params: CatalogSearchParams = {
    categoryId,
    subcategoryId,
    brandId,
    tags,
    minPrice,
    maxPrice,
    inStock: inStock ? "1" : "",
    sort: urlSort,
    options: optRaw,
    defaultSort,
  };

  return {
    filters: {
      categoryId,
      subcategoryId,
      brandIds,
      tags: tagSlugs,
      options,
      minPrice,
      maxPrice,
      inStock,
    },
    params,
    filterKey: [
      categoryPath ?? "",
      categoryId,
      subcategoryId,
      brandId,
      tags,
      minPrice,
      maxPrice,
      inStock,
      urlSort || defaultSort,
      JSON.stringify(optRaw),
    ].join("|"),
    sort: urlSort || defaultSort,
    setSort,
    page,
    setPage,
    chips,
    clearAll,
    setParams,
    toggle,
    categories,
    data,
    activeGroups,
    categoryPath,
    activeCategory,
    activeSubcategory,
    activeBrand,
    currency,
  };
}
