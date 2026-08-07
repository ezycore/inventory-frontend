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
  /**
   * Narrows a `categoryId` facet to one of its children. Sent alongside the
   * parent, never instead of it: a child's product carries BOTH ids, so the two
   * AND-combine correctly and the parent row stays lit while the child is on.
   */
  subcategoryId?: string;
  brandId?: string;
  /**
   * Comma-joined tag SLUGS, OR-combined.
   *
   * ONE param holding a list, not a repeated `?tag=` — `one()` below takes the
   * first of an array, so a repeated param would silently drop every tag but the
   * first, and the SSR seed and the client would then disagree about the key.
   */
  tags?: string;
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
    subcategoryId: one(raw.subcategoryId),
    brandId: one(raw.brandId),
    tags: one(raw.tags),
    minPrice: one(raw.minPrice),
    maxPrice: one(raw.maxPrice),
    inStock: one(raw.inStock),
    sort: one(raw.sort),
  };
}

/**
 * Everything the collection page filters and sorts by, minus the page cursor.
 *
 * This is what `useStoreProductsInfinite` is keyed on: an infinite query owns its
 * own cursor, and a `page` in its params would give every page a separate cache
 * entry — no accumulation, which is the whole point of the mode.
 */
export function catalogInfiniteParams(sp: CatalogSearchParams) {
  return {
    categoryId: sp.categoryId || undefined,
    subcategoryId: sp.subcategoryId || undefined,
    brandId: sp.brandId || undefined,
    tags: sp.tags || undefined,
    minPrice: sp.minPrice || undefined,
    maxPrice: sp.maxPrice || undefined,
    inStock: sp.inStock === "1" ? "1" : undefined,
    sort: sp.sort || undefined,
    limit: PRODUCTS_PAGE_SIZE,
  };
}

/** The exact request params `useStoreProducts` is called with on the collection page. */
export function catalogQueryParams(sp: CatalogSearchParams, page = 1) {
  return { ...catalogInfiniteParams(sp), page };
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
  // Tag facets combine without limit and every combination is the same product
  // set re-sliced — exactly the case the rule above exists for.
  if (sp.tags) return false;
  // `?categoryId=` is no longer a landing page: a collection's canonical URL is
  // its PATH (`/phones`), and two URLs claiming the same page compete. The query
  // form still works for anyone holding an old link; it just isn't indexed.
  // `?subcategoryId=` is the same URL one level down (`/phones/accessories`).
  if (sp.categoryId || sp.subcategoryId) return false;
  return true;
}

/**
 * The query string an indexable collection URL should self-canonicalize to. A
 * single facet is kept — `/products?brandId=…` is that brand's landing page and
 * must not collapse onto the unfiltered listing — and nothing else ever is,
 * because `isIndexableCatalogUrl` already rejected those URLs.
 */
export function catalogCanonicalQuery(sp: CatalogSearchParams): string {
  // Brand only: a category facet is never indexable now (its path page is), so
  // it can never reach this function.
  if (sp.brandId) return `?brandId=${encodeURIComponent(sp.brandId)}`;
  return "";
}

/**
 * The URL params for a category PATH page (`/phones`, `/phones/accessories`).
 *
 * `categoryPath` replaces BOTH id facets — the backend resolves it and picks the
 * right field to match on, which is what makes a parent page include its
 * children's products. Everything else (tags, price, stock, sort) still applies
 * on top, so a shopper can filter within a collection.
 */
export function categoryPathQueryParams(
  categoryPath: string,
  sp: CatalogSearchParams,
  page = 1,
) {
  const {
    categoryId: _categoryId,
    subcategoryId: _subcategoryId,
    ...rest
  } = catalogInfiniteParams(sp);
  return { ...rest, categoryPath, page };
}

/** Infinite-scroll variant of the above — same params, minus the page cursor. */
export function categoryPathInfiniteParams(
  categoryPath: string,
  sp: CatalogSearchParams,
) {
  const {
    categoryId: _categoryId,
    subcategoryId: _subcategoryId,
    ...rest
  } = catalogInfiniteParams(sp);
  return { ...rest, categoryPath };
}
