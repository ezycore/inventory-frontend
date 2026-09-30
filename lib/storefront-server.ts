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
 * every entry is tagged `store:{slug}` plus its scope — `site`, `catalog` or
 * `content` (`lib/storefront-cache-tags.ts`) — and an admin save flushes its
 * scope on demand via `POST /api/storefront/revalidate`. Raising one of these
 * numbers is therefore cheap for merchant-authored data and expensive for
 * anything else — see "Cache + on-demand revalidation" in
 * `.claude/skills/storefront/SKILL.md`.
 *
 * **Two sets of the same fetchers.** The named exports read the owner-preview
 * token off the request, so the merchant previewing an unpublished shop sees
 * it — and reading the request makes the calling route dynamic.
 * `publicStorefront` never reads the request and never previews, for routes
 * that must stay HTML-cacheable (the Storefront Builder's `/sites` route).
 * Catching the error `headers()` throws does not undo the dynamic bail-out, so a
 * cacheable route must not call the request-aware set at all.
 *
 * **The two sets also fail differently.** A 4xx is the API's answer — the store
 * or the thing is not there — and both return `null`. When the API gives no
 * answer (unreachable, or a 5xx) the request-aware set still returns `null`, but
 * `publicStorefront` throws `StorefrontUnavailableError`: a cached render that
 * turned an outage into `notFound()` stored that 404 for five minutes after the
 * API came back (measured 2026-09-14). A thrown render is not cached, and a
 * failed revalidation keeps the last good page.
 */

import { getStorePreviewToken } from "@/lib/storefront-host";
import { previewApiHeaders } from "@/lib/storefront-preview";
import { storefrontCacheTags, type StorefrontCacheScope } from "@/lib/storefront-cache-tags";
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
  CatalogCategoryDetail,
  ProductListResult,
  StoreCampaign,
  StoreCampaignDetail,
  StorefrontStore,
  StoreTag,
} from "@/lib/storefront-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SITE: readonly StorefrontCacheScope[] = ["site"];
const CATALOG: readonly StorefrontCacheScope[] = ["catalog"];
const CONTENT: readonly StorefrontCacheScope[] = ["content"];

/** The storefront API gave no answer — unreachable, or a 5xx. Not a statement about the store. */
export class StorefrontUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorefrontUnavailableError";
  }
}

/** What a read does when the API gives no answer: read it as "not there", or throw. */
type OnNoAnswer = "null" | "throw";

/** One storefront API read. `preview` is the owner-preview token, or `null` for the public payload. */
async function fetchStorefront<T>(
  slug: string,
  path: string,
  revalidate: number,
  scopes: readonly StorefrontCacheScope[],
  preview: string | null,
  onNoAnswer: OnNoAnswer,
): Promise<T | null> {
  const endpoint = `/storefront/${slug}${path}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      // A preview response is NOT shared cache. It is the one case where this
      // URL can return a payload the public may not have, so letting it settle
      // into the `store:{slug}` entry would serve an unpublished shop to the
      // next anonymous visitor. Preview is a handful of requests by one person;
      // paying full price for them is the correct trade.
      ...(preview
        ? { cache: "no-store" as const }
        : { next: { revalidate, tags: storefrontCacheTags(slug, scopes) } }),
      headers: { Accept: "application/json", ...previewApiHeaders(preview) },
    });
  } catch (error) {
    if (onNoAnswer === "throw") {
      throw new StorefrontUnavailableError(
        `Storefront API unreachable (${endpoint}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  }
  if (res.status >= 500 && onNoAnswer === "throw") {
    throw new StorefrontUnavailableError(`Storefront API failed with ${res.status} (${endpoint})`);
  }
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return (json?.data ?? null) as T;
}

type StorefrontRead = <T>(
  slug: string,
  path: string,
  revalidate: number,
  scopes: readonly StorefrontCacheScope[],
) => Promise<T | null>;

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
  /** Live campaign landing pages (`/campaigns/<slug>`). */
  campaigns: { slug: string }[];
}

/** Every endpoint, declared once, over a given way of reading. */
function fetchersFor(read: StorefrontRead) {
  return {
    /** Store config (branding, theme, payment/shipping rules). Cached 5 min. */
    getStore: (slug: string) => read<StorefrontStore>(slug, "", 300, SITE),

    /** Product list. Cached 1 min (catalog/stock changes more often). */
    getStoreProducts: (
      slug: string,
      params: Record<string, string | number | undefined> = {},
    ) => read<ProductListResult>(slug, `/products${query(params)}`, 60, CATALOG),

    getStoreProduct: (slug: string, productSlug: string) =>
      read<CatalogProduct>(slug, `/products/${productSlug}`, 60, CATALOG),

    getStoreCategories: (slug: string) =>
      read<CatalogCategory[]>(slug, "/categories", 300, CATALOG),

    /**
     * Resolve a collection path (`phones`, `phones/accessories`) to the category
     * plus its breadcrumb parent. `null` when the path is unknown OR sits under a
     * hidden parent — the page 404s on either.
     */
    getStoreCategoryByPath: (slug: string, path: string) =>
      read<CatalogCategoryDetail>(slug, `/categories/resolve${query({ path })}`, 300, CATALOG),

    getStoreTags: (slug: string) => read<StoreTag[]>(slug, "/tags", 300, CATALOG),

    getStoreCampaigns: (slug: string) => read<StoreCampaign[]>(slug, "/campaigns", 60, CATALOG),

    /**
     * One campaign by slug — its landing page's header. `null` when the slug is
     * unknown, the sale has ended, or the merchant switched it off; the page
     * 404s on that rather than rendering a discount banner over full prices.
     *
     * Cached 1 min like the campaign list: whether the sale is live is a
     * *server* judgement carried in `live`, so the window has to be re-read at
     * roughly the rate the catalogue's prices are.
     */
    getStoreCampaign: (slug: string, campaignSlug: string) =>
      read<StoreCampaignDetail>(
        slug,
        `/campaigns/${encodeURIComponent(campaignSlug)}`,
        60,
        CATALOG,
      ),

    getStorePages: (slug: string) => read<ContentPageLink[]>(slug, "/pages", 300, CONTENT),

    /**
     * One Storefront Builder page by its public path (`/pages/<slug>`). The
     * response carries either the page or, for a renamed page, the redirect to
     * its new address. Under owner preview it is the draft (`isDraft`).
     */
    getStorefrontPage: (slug: string, path: string) =>
      read<StorefrontPublicPage>(slug, `/page${query({ path })}`, 300, CONTENT),

    /**
     * Every catalogue query a builder page's sections make, in as few backend
     * calls as the backend's limits allow (usually one), merged into one map
     * keyed by section instance id. On the request-aware set a failed chunk
     * leaves its sections without data, and those sections render nothing; on
     * `publicStorefront` it throws, so a cached page never stores empty sections.
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
            CATALOG,
          ),
        ),
      );
      return Object.assign({}, ...chunks.map((chunk) => chunk?.results ?? {}));
    },

    /** Cached 1h: crawlers re-fetch far less often than shoppers browse, and the
     *  catalog and content tags still flush it on an admin edit. */
    getStoreSitemap: (slug: string) =>
      read<StorefrontSitemap>(slug, "/sitemap", 3600, ["catalog", "content"]),
  };
}

/** Every endpoint over one way of reading — the shape both sets below share. */
export type StorefrontReads = ReturnType<typeof fetchersFor>;

/**
 * Request-aware reads: the owner-preview token (`lib/storefront-preview.ts`) is
 * taken from the request, so a merchant previewing their unpublished shop from
 * the Customize editor sees it. Makes the calling route dynamic.
 *
 * Exported as a set as well as by name, for the server components that are
 * handed their reads (`PageFrame`, `BuilderPageBody`): the owner-preview page
 * route passes this set, the cached route passes `publicStorefront`.
 */
export const requestStorefront: StorefrontReads = fetchersFor(async (slug, path, revalidate, scopes) =>
  fetchStorefront(slug, path, revalidate, scopes, await getStorePreviewToken(), "null"),
);

export const {
  getStore,
  getStoreProducts,
  getStoreProduct,
  getStoreCategories,
  getStoreCategoryByPath,
  getStoreTags,
  getStoreCampaigns,
  getStoreCampaign,
  getStorePages,
  getStorefrontPage,
  getSectionData,
  getStoreSitemap,
} = requestStorefront;

/**
 * Public reads that never touch the request and never preview — the only set a
 * route that must stay HTML-cacheable may call. See the module note.
 */
export const publicStorefront = fetchersFor((slug, path, revalidate, scopes) =>
  fetchStorefront(slug, path, revalidate, scopes, null, "throw"),
);
