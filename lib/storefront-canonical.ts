// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";

/**
 * Where a store's public URLs point, regardless of which host served the request.
 *
 * A store with a custom domain is live on **both** `acme.com` and
 * `{slug}.ezycore.com/shop`. Both render, both are crawlable, and if each host
 * canonicalizes to itself a search engine indexes the catalogue twice and splits
 * the ranking signal. The backend picks the winner (`store.canonicalHost`, see
 * `utils/tenant-host.ts` `canonicalStoreHost`); this turns it into an origin+base
 * pair, because a custom domain serves the shop at the **root** — its base is
 * `""`, not `/shop`, even when the request arrived on a subdomain.
 *
 * Every absolute storefront URL goes through here: `<link rel="canonical">`,
 * `og:url`, sitemap entries and JSON-LD `url`s. If they disagree, the sitemap
 * advertises URLs that canonicalize elsewhere — a self-contradicting site.
 *
 * Falls back to the request's own origin/base when there is no custom domain,
 * which is the common case and leaves behaviour unchanged.
 */
export interface CanonicalTarget {
  /** Absolute origin, e.g. `https://acme.com`. Empty when the host is unknown. */
  origin: string;
  /** Public link base: `""` on a custom domain, `/shop` on a tenant subdomain. */
  base: string;
}

export function canonicalTarget(
  store: Pick<StorefrontStore, "canonicalHost"> | null | undefined,
  request: { origin: string; base: string },
): CanonicalTarget {
  const host = store?.canonicalHost?.trim();
  // A canonical host is always served over TLS — it only becomes `active` after
  // the on-demand certificate is issued.
  if (host) return { origin: `https://${host}`, base: "" };
  return { origin: request.origin, base: request.base };
}
