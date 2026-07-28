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

/** Collection and brand landing pages are query-filtered, not path-based. */
const facetUrl = (base: string, key: string, id: string) =>
  `${storeHref(base, "/products")}?${key}=${encodeURIComponent(id)}`;

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

  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: url(storeHref(base)), lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: url(storeHref(base, "/products")),
      lastModified: now,
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
      url: url(facetUrl(base, "categoryId", c.id)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  for (const b of data.brands) {
    entries.push({
      url: url(facetUrl(base, "brandId", b.id)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  for (const p of data.products) {
    entries.push({
      url: url(storeHref(base, `/products/${encodeURIComponent(p.slug)}`)),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  for (const p of data.pages) {
    entries.push({
      url: url(storeHref(base, `/pages/${encodeURIComponent(p.slug)}`)),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return entries;
}
