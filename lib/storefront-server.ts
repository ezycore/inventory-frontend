/**
 * Server-side storefront data — for SSR/ISR + SEO metadata. Mirrors the public
 * endpoints used by `lib/storefront-client.ts`, but fetched on the server with
 * Next's `revalidate` caching instead of `cache: "no-store"`, so storefront
 * pages render SEO-friendly HTML and re-validate periodically.
 *
 * Use these in Server Components / `generateMetadata`. Keep client interactivity
 * (cart, shopper auth) on the existing `services/storefront/hooks` client layer.
 */

import type {
  CatalogCategory,
  CatalogProduct,
  ContentPageLink,
  ContentPageView,
  ProductListResult,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function sf<T>(
  slug: string,
  path: string,
  revalidate: number,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/storefront/${slug}${path}`, {
      next: { revalidate, tags: [`store:${slug}`] },
      headers: { Accept: "application/json" },
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

export const getStoreCampaigns = (slug: string) =>
  sf<StoreCampaign[]>(slug, "/campaigns", 60);

export const getStorePages = (slug: string) =>
  sf<ContentPageLink[]>(slug, "/pages", 300);

export const getStorePage = (slug: string, pageSlug: string) =>
  sf<ContentPageView>(slug, `/pages/${pageSlug}`, 300);
