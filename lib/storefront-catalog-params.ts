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

/** Results per request on `/search` — larger than the collection page's, because
 *  search rows are denser and a searcher is scanning, not browsing. */
export const SEARCH_PAGE_SIZE = 24;

/** The filter/sort params the collection page reads off the URL. */
export interface CatalogSearchParams {
  categoryId?: string;
  /**
   * Narrows a `categoryId` facet to one of its children. Sent alongside the
   * parent, never instead of it: a child's product carries BOTH ids, so the two
   * AND-combine correctly and the parent row stays lit while the child is on.
   */
  subcategoryId?: string;
  /** Comma-joined brand ids, OR-combined (one id = the old single-select link). */
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
  /**
   * Variant-option facets, keyed by their full param name — `{ "opt.Size":
   * "M,L" }`. Kept as the raw params (not `{ Size: [...] }`) so they spread
   * straight into a request and the SSR seed and the client build the very same
   * cache key.
   */
  options?: Record<string, string>;
  /**
   * The merchant's default sort (Customize → Filters & sort), applied when the
   * URL names none. NOT read from the URL — a shop whose default is "Newest"
   * keeps clean URLs, and `isIndexableCatalogUrl` still sees an unsorted page.
   * Both the server seed and the client set it, so their cache keys agree.
   */
  defaultSort?: string;
}

/** Pick the `opt.*` params out of any key/value source, dropping blanks. */
export function optionParams(
  entries: Iterable<[string, string | string[] | undefined]>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of entries) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (key.startsWith("opt.") && key.length > 4 && value) out[key] = value;
  }
  return out;
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
    options: optionParams(Object.entries(raw)),
  };
}

/**
 * The 1-based page cursor, read from `?page=`.
 *
 * Deliberately **not** part of `CatalogSearchParams`: the facets describe *which*
 * products, the cursor describes *where in them*, and the two builders below take
 * the cursor as a separate argument precisely so an infinite query can drop it.
 * Folding it into the facet object would give every caller a `page` it has to
 * remember not to spread.
 *
 * Takes the raw value from either side — Next hands a server page
 * `string | string[] | undefined`, `useSearchParams().get()` returns
 * `string | null` — so the server and the client cannot read it differently.
 * Anything unparseable or below 1 is page 1; a URL is shopper-editable and a
 * `?page=abc` must not become `NaN` in a request.
 */
export function catalogPage(
  raw: string | string[] | undefined | null,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
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
    // `featured` is the backend's own default, so it is never sent — a shop that
    // kept it builds the exact key it always did.
    sort: sp.sort || (sp.defaultSort !== "featured" ? sp.defaultSort : undefined) || undefined,
    ...sp.options,
    limit: PRODUCTS_PAGE_SIZE,
  };
}

/** The exact request params `useStoreProducts` is called with on the collection page. */
export function catalogQueryParams(sp: CatalogSearchParams, page = 1) {
  return { ...catalogInfiniteParams(sp), page };
}

/**
 * The `/search` contract: a term plus the **same facets the collection page
 * offers**, over the same endpoint.
 *
 * Keeping search on these builders is what stops the two pages disagreeing about
 * what a facet means — a tag on `/search` narrows exactly as it does on
 * `/products`, because it is literally the same param. The term rides along as
 * `q`, which the backend matches against the product name, the catalog overlay's
 * online title/description, the description, the barcode, and its tag names.
 */
export function searchInfiniteParams(q: string, sp: CatalogSearchParams) {
  return {
    ...catalogInfiniteParams(sp),
    q: q || undefined,
    limit: SEARCH_PAGE_SIZE,
  };
}

/** Paged variant — same params plus the cursor. See the note above. */
export function searchQueryParams(
  q: string,
  sp: CatalogSearchParams,
  page = 1,
) {
  return { ...searchInfiniteParams(q, sp), page };
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
 *
 * `page` is that same judgement applied to depth. The cursor became a real URL
 * when it moved into the query string (so returning from a product lands the
 * shopper back where they were) — but page 4 of a collection is thin, duplicate
 * copy of the page-1 landing page, and only page 1 should hold the index slot.
 * `follow` still lets a crawler walk onward to the products themselves.
 */
export function isIndexableCatalogUrl(
  sp: CatalogSearchParams,
  page = 1,
): boolean {
  if (page > 1) return false;
  if (sp.minPrice || sp.maxPrice || sp.inStock || sp.sort) return false;
  // Tag facets combine without limit and every combination is the same product
  // set re-sliced — exactly the case the rule above exists for.
  if (sp.tags) return false;
  // Same for variant options and a multi-brand pick.
  if (sp.options && Object.keys(sp.options).length) return false;
  if (sp.brandId?.includes(",")) return false;
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

/**
 * The URL params for a CAMPAIGN landing page (`/campaigns/<slug>`).
 *
 * The campaign slug replaces nothing — it is AND-ed onto the facets server-side,
 * so a shopper can still filter and sort within the sale exactly as they can
 * within a collection. The category facets stay available for that reason
 * (unlike a collection page, where the collection *is* the URL): a campaign
 * spanning eight categories is precisely the case where narrowing to one is
 * useful.
 */
export function campaignQueryParams(
  campaign: string,
  sp: CatalogSearchParams,
  page = 1,
) {
  return { ...catalogInfiniteParams(sp), campaign, page };
}

/** Infinite-scroll variant of the above — same params, minus the page cursor. */
export function campaignInfiniteParams(
  campaign: string,
  sp: CatalogSearchParams,
) {
  return { ...catalogInfiniteParams(sp), campaign };
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
