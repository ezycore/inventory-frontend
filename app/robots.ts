// coding-standard: maintained
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  hostnameOf,
  isLocalDevHost,
  isTenantRoutingConfigured,
  resolveStoreForHost,
} from "@/lib/storefront-host-map";

/**
 * Per-host `robots.txt`. One codebase serves every store plus the admin app, and
 * which of those a host is deciding what may be crawled — so this is resolved per
 * request, not shipped as a static file.
 *
 * It resolves the host itself rather than reading the `x-ezy-store-*` headers:
 * `proxy.ts`'s matcher excludes any path containing a dot, so `/robots.txt` never
 * passes through it. `lib/storefront-host-map.ts` is the shared rule set that keeps
 * the two answers identical.
 */

// Storefront paths that exist to transact, not to be found. They already send
// `noindex` in their metadata; blocking them here saves the crawl budget too.
const PRIVATE_PATHS = ["/cart", "/checkout", "/account", "/search"];

/**
 * Host-root files a crawler must still reach on a tenant subdomain, where the
 * store lives under `/shop` and everything else is disallowed. Not prefixed
 * with `base` — these are served from the root whatever the store's path is.
 */
const PUBLIC_FILES = [
  "/_next/static/",
  "/_next/image",
  "/sitemap.xml",
  "/favicon.ico",
  "/icon.png",
];

// The answer depends on the request host, so this can never be prerendered — one
// baked robots.txt would be served to every tenant.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const hostHeader = h.get("host") || "";
  const host = hostnameOf(hostHeader);

  // Misconfigured build: `base` would be a guess, so every path rule below could
  // guard the wrong prefix. Emit the neutral answer — identical to serving no
  // robots.txt at all — rather than a confident wrong one. See
  // `isTenantRoutingConfigured`.
  if (!isTenantRoutingConfigured() && !isLocalDevHost(host)) {
    return { rules: [{ userAgent: "*", allow: "/" }] };
  }

  const store = await resolveStoreForHost(host);

  // Not a storefront: the tenant root, `app.`/`www.`, or an unknown host. Every
  // one of those serves the admin app, which is behind auth and must never be
  // indexed — a bare Disallow is the whole answer.
  if (!store) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const proto = h.get("x-forwarded-proto") || "https";
  const base = store.base;
  const disallow = PRIVATE_PATHS.map((p) => `${base}${p}`);

  return {
    rules: [
      base
        ? // Tenant subdomain: the admin app owns the root and only `/shop` is
          // public. Longer, more specific paths win over the Allow, so the
          // private storefront paths stay blocked.
          //
          // The blanket `Disallow: /` also covers same-host files the store
          // needs crawled, so each is re-allowed: `/_next/static/` and
          // `/_next/image` are the storefront's own CSS, JS and product images
          // (blocking them has Google render the shop unstyled and index no
          // images), `/sitemap.xml` is the file the Sitemap line below points
          // at, and `/favicon.ico` has to be fetchable for the icon to show
          // beside a search result. `/icon.png` rides along because
          // `app/favicon.ico/route.ts` redirects there for a store that has not
          // uploaded an icon — a crawler blocked at the redirect target sees the
          // same nothing as one blocked at the redirect. Every one is a longer
          // path than `/`, so specificity lets them through without loosening
          // anything else.
          {
            userAgent: "*",
            allow: [base, ...PUBLIC_FILES],
            disallow: ["/", ...disallow],
          }
        : // Custom domain: the store IS the site.
          { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: `${proto}://${hostHeader}/sitemap.xml`,
  };
}
