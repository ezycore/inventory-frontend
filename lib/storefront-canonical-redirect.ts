// coding-standard: maintained
/**
 * Where a storefront request should be permanently redirected to, if anywhere.
 *
 * A store with a custom domain is live on every host that resolves to it —
 * `uriibaba.com`, a registered `www.uriibaba.com`, and `uriibaba.ezycore.com/shop`.
 * All of them render. `<link rel="canonical">` asks a search engine to pick one,
 * but it is a hint: until it is honoured the catalogue is crawled two or three
 * times over, inbound links land on different origins, and the ranking signal
 * splits. A 301 is the instruction, not the hint — and it also stops merchants
 * pasting the platform subdomain into a Facebook post.
 *
 * Pure decision, kept out of `proxy.ts` so every case below is a unit test rather
 * than something you can only observe by curling production. The proxy owns the
 * env-shaped guards (local dev, misconfigured build) and the actual `Response`.
 *
 * See `docs/plan/storefront-seo.md` §S0.1 (backend repo) for why this exists and
 * what it deliberately does not do.
 */

/** Methods a permanent redirect is safe on. Everything else passes through. */
const REDIRECTABLE = new Set(["GET", "HEAD"]);

export interface CanonicalRedirect {
  /** Hostname to redirect to (no scheme, no port). */
  host: string;
  /** Path on that host, always absolute and never carrying the `/shop` prefix. */
  path: string;
}

export interface CanonicalRedirectInput {
  method: string;
  /** Serving hostname, lowercased, port already stripped. */
  host: string;
  pathname: string;
  /** Where the store is served on THIS host: `/shop` on a tenant subdomain. */
  base: "/shop" | "";
  /** The store's one canonical host, or null when the serving host is it. */
  canonicalHost: string | null;
}

/**
 * Returns the redirect target, or `null` to serve the request where it is.
 *
 * `null` is the safe answer and the default for anything uncertain — a wrong 301
 * points a live store at a host it does not own, and browsers cache those hard.
 */
export function canonicalRedirectFor(
  input: CanonicalRedirectInput,
): CanonicalRedirect | null {
  const { method, host, pathname, base, canonicalHost } = input;

  if (!REDIRECTABLE.has(method.toUpperCase())) return null;

  // A canonical host is always a custom domain, and a custom domain always serves
  // the store at its root — so the moment one is in play, `/shop` is not part of
  // the public URL. Without this condition a subdomain store with no custom
  // domain would have `/shop` stripped and land on its own admin app.
  const targetServesAtRoot = canonicalHost !== null || base === "";
  const path = targetServesAtRoot
    ? pathname.replace(/^\/shop/, "") || "/"
    : pathname;

  const targetHost = canonicalHost ?? host;

  // Nothing to say: already the right host, already the right path.
  if (targetHost === host && path === pathname) return null;

  return { host: targetHost, path };
}
