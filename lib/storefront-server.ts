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
 */

import { getStorePreviewToken } from "@/lib/storefront-host";
import { previewApiHeaders } from "@/lib/storefront-preview";
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

async function sf<T>(
  slug: string,
  path: string,
  revalidate: number,
): Promise<T | null> {
  try {
    // Owner preview (`lib/storefront-preview.ts`): the merchant looking at their
    // own unpublished shop from the Customize editor.
    const preview = await getStorePreviewToken();
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

function query(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Store config (branding, theme, payment/shipping rules). Cached 5 min. */
export const getStore = (slug: string) => sf<StorefrontStore>(slug, "", 300);

/** Product list. Cached 1 min (catalog/stock changes more often). */
export const getStoreProducts = (
  slug: string,
  params: Record<string, string | number | undefined> = {},
) => sf<ProductListResult>(slug, `/products${query(params)}`, 60);

export const getStoreProduct = (slug: string, productSlug: string) =>
  sf<CatalogProduct>(slug, `/products/${productSlug}`, 60);

export const getStoreCategories = (slug: string) =>
  sf<CatalogCategory[]>(slug, "/categories", 300);

/**
 * Resolve a collection path (`phones`, `phones/accessories`) to the category
 * plus its breadcrumb parent. `null` when the path is unknown OR sits under a
 * hidden parent — the page 404s on either.
 */
export const getStoreCategoryByPath = (slug: string, path: string) =>
  sf<CatalogCategoryDetail>(
    slug,
    `/categories/resolve${query({ path })}`,
    300,
  );

export const getStoreTags = (slug: string) =>
  sf<StoreTag[]>(slug, "/tags", 300);

export const getStoreCampaigns = (slug: string) =>
  sf<StoreCampaign[]>(slug, "/campaigns", 60);

export const getStorePages = (slug: string) =>
  sf<ContentPageLink[]>(slug, "/pages", 300);

export const getStorePage = (slug: string, pageSlug: string) =>
  sf<ContentPageView>(slug, `/pages/${pageSlug}`, 300);

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

/** Cached 1h: crawlers re-fetch far less often than shoppers browse, and the
 *  `store:{slug}` tag still flushes it on an admin edit. */
export const getStoreSitemap = (slug: string) =>
  sf<StorefrontSitemap>(slug, "/sitemap", 3600);
