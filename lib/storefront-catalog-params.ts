// coding-standard: maintained

/**
 * The collection page's URL contract, in one place.
 *
 * Two callers must agree exactly: `app/(storefront)/shop/products/page.tsx`
 * fetches on the server to seed the query cache, and `view.tsx` reads that cache
 * on the client. The cache key is the params object itself, so a single differing
 * key — an empty string where the other side sends `undefined` — silently misses
 * the seed and the page falls back to a client fetch (i.e. an empty SSR body,
 * which is exactly the bug the seeding exists to fix).
 */

export const PRODUCTS_PAGE_SIZE = 12;

/** The filter/sort params the collection page reads off the URL. */
export interface CatalogSearchParams {
  categoryId?: string;
  brandId?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: string;
}

/** Normalize whatever Next hands a server page (`?a=1&a=2` arrives as an array). */
export function catalogSearchParams(
  raw: Record<string, string | string[] | undefined>,
): CatalogSearchParams {
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) || "";
  return {
    categoryId: one(raw.categoryId),
    brandId: one(raw.brandId),
    minPrice: one(raw.minPrice),
    maxPrice: one(raw.maxPrice),
    inStock: one(raw.inStock),
    sort: one(raw.sort),
  };
}

/** The exact request params `useStoreProducts` is called with on the collection page. */
export function catalogQueryParams(sp: CatalogSearchParams, page = 1) {
  return {
    categoryId: sp.categoryId || undefined,
    brandId: sp.brandId || undefined,
    minPrice: sp.minPrice || undefined,
    maxPrice: sp.maxPrice || undefined,
    inStock: sp.inStock === "1" ? "1" : undefined,
    sort: sp.sort || undefined,
    page,
    limit: PRODUCTS_PAGE_SIZE,
  };
}

/**
 * Whether a collection URL is worth indexing.
 *
 * A single category or brand facet is a real landing page (`/products?brandId=…`
 * *is* that brand's page, h1 and all). Everything else — price bounds, the
 * in-stock switch, a sort order, or two facets at once — is the same product set
 * re-sliced, and the combinations multiply without limit. Crawlers will happily
 * walk every one of them, so those get `noindex, follow`: the links are still
 * worth traversing, the URLs are not worth storing.
 */
export function isIndexableCatalogUrl(sp: CatalogSearchParams): boolean {
  if (sp.minPrice || sp.maxPrice || sp.inStock || sp.sort) return false;
  return !(sp.categoryId && sp.brandId);
}

/**
 * The query string an indexable collection URL should self-canonicalize to. A
 * single facet is kept — `/products?brandId=…` is that brand's landing page and
 * must not collapse onto the unfiltered listing — and nothing else ever is,
 * because `isIndexableCatalogUrl` already rejected those URLs.
 */
export function catalogCanonicalQuery(sp: CatalogSearchParams): string {
  if (sp.categoryId) return `?categoryId=${encodeURIComponent(sp.categoryId)}`;
  if (sp.brandId) return `?brandId=${encodeURIComponent(sp.brandId)}`;
  return "";
}
