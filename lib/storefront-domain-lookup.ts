// coding-standard: maintained
/**
 * Dynamic store resolution for `proxy.ts`, against the backend's public
 * `store-by-host` endpoint.
 *
 * Two questions, one endpoint, one cache:
 *
 *  - **host → slug.** Hosts that aren't tenant subdomains (`{slug}.ezycore.com`)
 *    can still be storefronts: merchants add their own domain in Settings →
 *    Domains, verify it via TXT record, and Caddy issues the cert on demand. The
 *    org's `domains` array is the only place that mapping lives, so the proxy
 *    asks the backend instead of relying on the build-time
 *    `NEXT_PUBLIC_CUSTOM_DOMAIN_MAP` env.
 *  - **→ canonical host.** The one host a store's public URLs belong to. A store
 *    with a custom domain is live on *both* that domain and `{slug}.ezycore.com/shop`,
 *    and a registered `www.` twin makes three. Only one of them may be the
 *    indexed site; this is how the proxy learns which, so it can 301 the rest.
 *    `null` means the serving host is already the answer — the common case.
 *
 * Answers are cached in module memory so steady-state traffic costs no extra
 * request: hits and misses for 60s (matches the endpoint's Cache-Control),
 * API failures for 10s — long enough to stop a per-request stampede while the
 * backend blips (the storefront can't render without the API anyway), short
 * enough that recovery is quick. Entry count is bounded against Host-header
 * spray from scanners.
 *
 * **Never throws.** Every failure degrades to "not a store, no canonical host",
 * which makes the proxy serve the request exactly as it did before this module
 * existed. That matters more here than anywhere else in the request path: a
 * confident wrong answer is a 301 pointing a live store at a host it does not
 * own, and browsers cache those.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const HIT_TTL_MS = 60_000;
const ERROR_TTL_MS = 10_000;
const MAX_ENTRIES = 500;
const FETCH_TIMEOUT_MS = 3_000;

/** What the endpoint answers, normalized. Both fields null ⇒ not a store. */
interface StoreAnswer {
  slug: string | null;
  canonicalHost: string | null;
}

const MISS: StoreAnswer = { slug: null, canonicalHost: null };

const cache = new Map<string, { answer: StoreAnswer; expiresAt: number }>();

/**
 * One fetch, one cache entry. `cacheKey` is prefixed by query form so a host and
 * a slug that happen to read the same can never share an answer.
 */
async function resolve(
  cacheKey: string,
  query: string,
): Promise<StoreAnswer> {
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.answer;

  let answer = MISS;
  let ttl = HIT_TTL_MS;
  try {
    const res = await fetch(`${API_BASE}/public/store-by-host?${query}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const data = json?.data;
      if (data?.exists && typeof data.slug === "string") {
        answer = {
          slug: data.slug,
          canonicalHost:
            typeof data.canonicalHost === "string" ? data.canonicalHost : null,
        };
      }
    } else {
      ttl = ERROR_TTL_MS;
    }
  } catch {
    ttl = ERROR_TTL_MS;
  }

  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(cacheKey, { answer, expiresAt: now + ttl });
  return answer;
}

const byHost = (host: string): Promise<StoreAnswer> =>
  resolve(`h:${host}`, `host=${encodeURIComponent(host)}`);

const bySlug = (slug: string): Promise<StoreAnswer> =>
  resolve(`s:${slug}`, `slug=${encodeURIComponent(slug)}`);

/** Resolve a custom-domain host to its store slug, or null when it maps to no
 *  active store. */
export async function lookupStoreByHost(host: string): Promise<string | null> {
  return (await byHost(host)).slug;
}

/**
 * The canonical host for the store served at `host`. Shares the cache entry with
 * `lookupStoreByHost`, so resolving both for one request costs one fetch.
 */
export async function lookupCanonicalHostByHost(
  host: string,
): Promise<string | null> {
  return (await byHost(host)).canonicalHost;
}

/**
 * The canonical host for a store known by slug — the tenant-subdomain case,
 * where the proxy resolved the slug from build-time config and never needed the
 * host→slug direction.
 */
export async function lookupCanonicalHostBySlug(
  slug: string,
): Promise<string | null> {
  return (await bySlug(slug)).canonicalHost;
}
