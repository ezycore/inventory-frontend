// coding-standard: maintained
/**
 * Dynamic custom-domain → store-slug resolution for `proxy.ts`.
 *
 * Hosts that aren't tenant subdomains (`{slug}.ezycore.com`) can still be
 * storefronts: merchants add their own domain in Settings → Domains, verify it
 * via TXT record, and Caddy issues the cert on demand. The org's `domains`
 * array is the only place that host→slug mapping lives, so the proxy asks the
 * backend's public `store-by-host` endpoint (active domains only) instead of
 * relying on the build-time `NEXT_PUBLIC_CUSTOM_DOMAIN_MAP` env.
 *
 * Answers are cached in module memory so steady-state traffic costs no extra
 * request: hits and misses for 60s (matches the endpoint's Cache-Control),
 * API failures for 10s — long enough to stop a per-request stampede while the
 * backend blips (the storefront can't render without the API anyway), short
 * enough that recovery is quick. Entry count is bounded against Host-header
 * spray from scanners.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const HIT_TTL_MS = 60_000;
const ERROR_TTL_MS = 10_000;
const MAX_ENTRIES = 500;
const FETCH_TIMEOUT_MS = 3_000;

const cache = new Map<string, { slug: string | null; expiresAt: number }>();

/** Resolve a custom-domain host to its store slug, or null when it maps to no
 *  active store. Never throws — failures degrade to "not a store". */
export async function lookupStoreByHost(host: string): Promise<string | null> {
  const now = Date.now();
  const cached = cache.get(host);
  if (cached && cached.expiresAt > now) return cached.slug;

  let slug: string | null = null;
  let ttl = HIT_TTL_MS;
  try {
    const res = await fetch(
      `${API_BASE}/public/store-by-host?host=${encodeURIComponent(host)}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const data = json?.data;
      slug = data?.exists && typeof data.slug === "string" ? data.slug : null;
    } else {
      ttl = ERROR_TTL_MS;
    }
  } catch {
    ttl = ERROR_TTL_MS;
  }

  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(host, { slug, expiresAt: now + ttl });
  return slug;
}
