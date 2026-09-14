// coding-standard: maintained
/**
 * Server-side storefront data — for SSR/ISR + SEO metadata. Mirrors the public
 * endpoints used by `lib/storefront-client.ts`, but fetched on the server with
 * Next's `revalidate` caching instead of `cache: "no-store"`, so storefront
 * pages render SEO-friendly HTML and re-validate periodically.
 *
 * Use these in Server Components / `generateMetadata`. Keep client interactivity
 * (cart, shopper auth) on the existing `services/storefront/hooks` client layer.
 *
 * The `revalidate` values below are the *backstop*, not the freshness guarantee:
 * every entry is tagged `store:{slug}` and an admin save flushes the tag on demand
 * via `POST /api/storefront/revalidate`. Raising one of these numbers is therefore
 * cheap for merchant-authored data and expensive for anything else — see
 * "Cache + on-demand revalidation" in `.claude/skills/storefront/SKILL.md`.
 *
 * **Two sets of the same fetchers.** The named exports read the owner-preview
 * token off the request, so the merchant previewing an unpublished shop sees
 * it — and reading the request makes the calling route dynamic.
 * `publicStorefront` never reads the request and never previews, for routes
 * that must stay HTML-cacheable (the Storefront Builder's `/sites` route).
 * Catching the error `headers()` throws does not undo the dynamic bail-out, so a
 * cacheable route must not call the request-aware set at all.
 */

import { getStorePreviewToken } from "@/lib/storefront-host";
import { previewApiHeaders } from "@/lib/storefront-preview";
import {
  chunkSectionDataRequests,
  type ProductsDataRequest,
  type SectionData,
} from "@/lib/storefront-builder/section-data";
import type { StorefrontPublicPage } from "@/types/api";
import type {
  CatalogCategory,
  CatalogProduct,
  ContentPageLink,
  ContentPageView,
  CatalogCategoryDetail,
  ProductListResult,
  StoreCampaign,
  StorefrontStore,
  StoreTag,
} from "@/lib/storefront-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/** One storefront API read. `preview` is the owner-preview token, or `null` for the public payload. */
async function fetchStorefront<T>(
  slug: string,
  path: string,
  revalidate: number,
  preview: string | null,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/storefront/${slug}${path}`, {
      // A preview response is NOT shared cache. It is the one case where this
      // URL can return a payload the public may not have, so letting it settle
      // into the `store:{slug}` entry would serve an unpublished shop to the
      // next anonymous visitor. Preview is a handful of requests by one person;
      // paying full price for them is the correct trade.
      ...(preview
        ? { cache: "no-store" as const }
        : { next: { revalidate, tags: [`store:${slug}`] } }),
      headers: { Accept: "application/json", ...previewApiHeaders(preview) },
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return (json?.data ?? null) as T;
  } catch {
    return null;
  }
}

type StorefrontRead = <T>(slug: string, path: string, revalidate: number) => Promise<T | null>;

function query(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/**
 * Every crawlable URL for the store, for `app/sitemap.ts`. Server-only — no client
 * hook consumes it, so unlike the types above this one lives here rather than in
 * `storefront-client.ts`. Identifiers, not paths: only the request host knows
 * whether the store is served at `/shop` or at the root.
 */
export interface StorefrontSitemap {
  products: { slug: string; updatedAt?: string }[];
  /** Collection PATHS (`phones`, `phones/accessories`) — both levels. */
  collections: { path: string }[];
  brands: { id: string }[];
  pages: { slug: string; updatedAt?: string }[];
}

/** Every endpoint, declared once, over a given way of reading. */
function fetchersFor(read: StorefrontRead) {
  return {
    /** Store config (branding, theme, payment/shipping rules). Cached 5 min. */
    getStore: (slug: string) => read<StorefrontStore>(slug, "", 300),

    /** Product list. Cached 1 min (catalog/stock changes more often). */
    getStoreProducts: (
      slug: string,
      params: Record<string, string | number | undefined> = {},
    ) => read<ProductListResult>(slug, `/products${query(params)}`, 60),

    getStoreProduct: (slug: string, productSlug: string) =>
      read<CatalogProduct>(slug, `/products/${productSlug}`, 60),

    getStoreCategories: (slug: string) =>
      read<CatalogCategory[]>(slug, "/categories", 300),

    /**
     * Resolve a collection path (`phones`, `phones/accessories`) to the category
     * plus its breadcrumb parent. `null` when the path is unknown OR sits under a
     * hidden parent — the page 404s on either.
     */
    getStoreCategoryByPath: (slug: string, path: string) =>
      read<CatalogCategoryDetail>(slug, `/categories/resolve${query({ path })}`, 300),

    getStoreTags: (slug: string) => read<StoreTag[]>(slug, "/tags", 300),

    getStoreCampaigns: (slug: string) => read<StoreCampaign[]>(slug, "/campaigns", 60),

    getStorePages: (slug: string) => read<ContentPageLink[]>(slug, "/pages", 300),

    getStorePage: (slug: string, pageSlug: string) =>
      read<ContentPageView>(slug, `/pages/${pageSlug}`, 300),

    /**
     * One Storefront Builder page by its public path (`/pages/<slug>`). The
     * response carries either the page or, for a renamed page, the redirect to
     * its new address. Under owner preview it is the draft (`isDraft`).
     */
    getStorefrontPage: (slug: string, path: string) =>
      read<StorefrontPublicPage>(slug, `/page${query({ path })}`, 300),

    /**
     * Every catalogue query a builder page's sections make, in as few backend
     * calls as the backend's limits allow (usually one), merged into one map
     * keyed by section instance id. A failed chunk leaves its sections without
     * data, and those sections render nothing.
     */
    getSectionData: async (
      slug: string,
      requests: readonly ProductsDataRequest[],
    ): Promise<Record<string, SectionData>> => {
      if (requests.length === 0) return {};
      const chunks = await Promise.all(
        chunkSectionDataRequests(requests).map((chunk) =>
          read<{ results: Record<string, SectionData> }>(
            slug,
            `/section-data${query({ r: JSON.stringify(chunk) })}`,
            60,
          ),
        ),
      );
      return Object.assign({}, ...chunks.map((chunk) => chunk?.results ?? {}));
    },

    /** Cached 1h: crawlers re-fetch far less often than shoppers browse, and the
     *  `store:{slug}` tag still flushes it on an admin edit. */
    getStoreSitemap: (slug: string) => read<StorefrontSitemap>(slug, "/sitemap", 3600),
  };
}

/**
 * Request-aware reads: the owner-preview token (`lib/storefront-preview.ts`) is
 * taken from the request, so a merchant previewing their unpublished shop from
 * the Customize editor sees it. Makes the calling route dynamic.
 */
const requestStorefront = fetchersFor(async <T>(slug: string, path: string, revalidate: number) =>
  fetchStorefront<T>(slug, path, revalidate, await getStorePreviewToken()),
);

export const {
  getStore,
  getStoreProducts,
  getStoreProduct,
  getStoreCategories,
  getStoreCategoryByPath,
  getStoreTags,
  getStoreCampaigns,
  getStorePages,
  getStorePage,
  getStorefrontPage,
  getSectionData,
  getStoreSitemap,
} = requestStorefront;

/**
 * Public reads that never touch the request and never preview — the only set a
 * route that must stay HTML-cacheable may call. See the module note.
 */
export const publicStorefront = fetchersFor(<T>(slug: string, path: string, revalidate: number) =>
  fetchStorefront<T>(slug, path, revalidate, null),
);
