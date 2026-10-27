// coding-standard: maintained
import { headers } from "next/headers";
import {
  hostnameOf,
  isLocalDevHost,
  isTenantRoutingConfigured,
  resolveStoreForHost,
} from "@/lib/storefront-host-map";
import { publicStorefront } from "@/lib/storefront-server";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { storeHref } from "@/lib/storefront-links";
import { productFeedXml } from "@/lib/product-feed-xml";

/**
 * `/feeds/products.xml` on a shop's host — the catalog link Facebook/Instagram, Google Merchant
 * Center, TikTok and Pinterest read (backend `docs/plan/product-feed.md`). 404 unless the merchant
 * turned the feed on.
 *
 * Resolves the host itself, like `app/sitemap.ts`: the proxy's matcher skips dotted paths, so no
 * `x-ezy-store-*` headers reach this route. Uses the public reads — never the owner preview — so
 * an unpublished shop's catalog cannot leak through a preview token.
 */

// Host-dependent, so never prerendered. The upstream fetch is cached for an hour.
export const dynamic = "force-dynamic";

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET() {
  const h = await headers();
  const hostHeader = h.get("host") || "";
  const host = hostnameOf(hostHeader);
  if (!isTenantRoutingConfigured() && !isLocalDevHost(host)) return notFound();

  const store = await resolveStoreForHost(host);
  if (!store) return notFound();

  let info, feed;
  try {
    [info, feed] = await Promise.all([
      publicStorefront.getStore(store.slug),
      publicStorefront.getStoreProductFeed(store.slug),
    ]);
  } catch {
    // A backend outage must not hand readers an empty catalog: Meta and Google would mark every
    // product removed. A 503 makes them keep what they have and retry.
    return new Response("Feed temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "600", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (!feed?.enabled) return notFound();

  // Links must be canonical, or every item points at a URL that redirects to the custom domain.
  const proto = h.get("x-forwarded-proto") || "https";
  const { origin, base } = canonicalTarget(info, { origin: `${proto}://${hostHeader}`, base: store.base });

  const xml = productFeedXml(feed, {
    homeUrl: `${origin}${storeHref(base)}`,
    productUrl: (slug) => `${origin}${storeHref(base, `/products/${encodeURIComponent(slug)}`)}`,
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
      // A data file for catalog readers, not a page for search results.
      "X-Robots-Tag": "noindex",
    },
  });
}
