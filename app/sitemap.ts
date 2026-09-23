// coding-standard: maintained
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  hostnameOf,
  isLocalDevHost,
  isTenantRoutingConfigured,
  resolveStoreForHost,
} from "@/lib/storefront-host-map";
import { getStore, getStoreSitemap } from "@/lib/storefront-server";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { storeHref } from "@/lib/storefront-links";

/**
 * Per-host `sitemap.xml`. The backend returns identifiers
 * (`GET /api/storefront/{slug}/sitemap`); the absolute URLs can only be built
 * here, because the same store is served at `/shop` on a tenant subdomain and at
 * the root on a custom domain.
 *
 * Host resolution is done locally for the same reason as `robots.ts`: the proxy's
 * matcher skips dotted paths, so no `x-ezy-store-*` headers reach this route.
 */

// Host-dependent, so never prerendered. The upstream fetch is still cached
// (`getStoreSitemap` revalidates hourly), so a crawler hit is cheap.
export const dynamic = "force-dynamic";

/** Brand landing pages are still query-filtered. Collections are not — see below. */
const facetUrl = (base: string, key: string, id: string) =>
  `${storeHref(base, "/products")}?${key}=${encodeURIComponent(id)}`;

/**
 * A collection's canonical URL is its PATH (`/phones`, `/phones/accessories`),
 * not the `?categoryId=` facet it used to be. The query form still resolves for
 * anyone holding an old link, but it now canonicalizes to the path — so
 * advertising it here would point crawlers at URLs that disclaim themselves.
 */
const collectionUrl = (base: string, path: string) =>
  storeHref(base, `/${path.split("/").map(encodeURIComponent).join("/")}`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const hostHeader = h.get("host") || "";
  const host = hostnameOf(hostHeader);

  // Misconfigured build: `base` would be a guess, and a sitemap built on the wrong
  // base is a list of 404s — strictly worse than no sitemap. Emit nothing rather
  // than something false. See `isTenantRoutingConfigured`.
  if (!isTenantRoutingConfigured() && !isLocalDevHost(host)) return [];

  const store = await resolveStoreForHost(host);
  // An admin or unknown host has no public URL set — robots.txt disallows it wholesale.
  if (!store) return [];

  const proto = h.get("x-forwarded-proto") || "https";
  const [info, data] = await Promise.all([
    getStore(store.slug),
    getStoreSitemap(store.slug),
  ]);

  // A sitemap must list canonical URLs. If it advertised the serving host while
  // the pages canonicalize to the store's own domain, every entry would point at
  // a URL that disclaims itself — so both go through `canonicalTarget`.
  const target = canonicalTarget(info, {
    origin: `${proto}://${hostHeader}`,
    base: store.base,
  });
  const { origin, base } = target;
  const url = (path: string) => `${origin}${path}`;

  /**
   * `lastmod` is a claim, and a claim that always says "just now" is one a search
   * engine learns to discount — taking the honest entries down with it. So every
   * date below is a real one or absent:
   *
   *  - products and pages carry their own `updatedAt`;
   *  - the home page and `/products` are catalogue views, so the newest product
   *    edit IS their last modification;
   *  - **collections and brands get none.** The public taxonomy readers don't
   *    project `updatedAt`, and widening a shopper-facing payload to feed a
   *    sitemap is the wrong trade. Omitting the field is a valid sitemap and an
   *    honest one; inventing `now` was neither.
   */
  const newest = (dates: (string | undefined)[]): Date | undefined => {
    const stamps = dates
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime())
      .filter((t) => Number.isFinite(t));
    return stamps.length ? new Date(Math.max(...stamps)) : undefined;
  };

  const catalogUpdatedAt = newest((data?.products ?? []).map((p) => p.updatedAt));

  const entries: MetadataRoute.Sitemap = [
    {
      url: url(storeHref(base)),
      lastModified: catalogUpdatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: url(storeHref(base, "/products")),
      lastModified: catalogUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // A backend blip must not produce an empty sitemap that looks authoritative —
  // `getStoreSitemap` returns null rather than throwing, so fall back to the two
  // entry points above, which are always valid.
  if (!data) return entries;

  for (const c of data.collections) {
    entries.push({
      url: url(collectionUrl(base, c.path)),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  for (const b of data.brands) {
    entries.push({
      url: url(facetUrl(base, "brandId", b.id)),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  for (const p of data.products) {
    entries.push({
      url: url(storeHref(base, `/products/${encodeURIComponent(p.slug)}`)),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  // Live sales only (the backend filters), and no `lastmod`: the page's content
  // is the catalogue, which changes on its own clock, not the campaign row's.
  for (const c of data.campaigns ?? []) {
    entries.push({
      url: url(storeHref(base, `/campaigns/${encodeURIComponent(c.slug)}`)),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }
  for (const p of data.pages) {
    entries.push({
      url: url(storeHref(base, `/pages/${encodeURIComponent(p.slug)}`)),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return entries;
}
