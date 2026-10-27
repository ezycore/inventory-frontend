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
 *  - **does this workspace exist?** Every `*.ezycore.com` name reaches the
 *    frontend, so a slug read off the host is only a guess. Scanners invent
 *    hundreds (`gitlab.`, `mail.`, `exchange.`…) and each one used to render
 *    the admin app or the shop, fanning out into backend calls that all ended in
 *    STOREFRONT_NOT_FOUND. The slug form answers that too, from the same entry.
 *
 * Answers are cached in module memory so steady-state traffic costs no extra
 * request: hits and misses for 60s (matches the endpoint's Cache-Control),
 * API failures for 10s — long enough to stop a per-request stampede while the
 * backend blips (the storefront can't render without the API anyway), short
 * enough that recovery is quick. Entry count is bounded against Host-header
 * spray from scanners.
 *
 * **Never throws, and never invents an answer.** When the API gives no answer
 * (unreachable, a 5xx, a 429 — `isNoAnswer`), the last answer it DID give for
 * that key is reused: a domain that resolved a minute ago still resolves. With no
 * earlier answer the result is "no store, no canonical host" — never a guessed
 * canonical host, because a confident wrong answer is a 301 pointing a live
 * store at a host it does not own, and browsers cache those.
 *
 * "No store" is not the same as "could not tell", though: on a custom domain the
 * first sends a shopper to the admin login. That happened on 2026-10-23, when the
 * backend's rate limit ran out, so `isHostLookupUnavailable` lets the proxy tell
 * the two apart and answer a retryable 503 instead.
 */

import { isNoAnswer, serverApiHeaders } from "@/lib/server-api";

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

interface Entry {
  answer: StoreAnswer;
  expiresAt: number;
  /** False when the API has never answered for this key — the answer is a placeholder. */
  known: boolean;
}

const cache = new Map<string, Entry>();

/** The API's answer, or `undefined` when it gave none. */
async function ask(query: string): Promise<StoreAnswer | undefined> {
  try {
    const res = await fetch(`${API_BASE}/public/store-by-host?${query}`, {
      headers: serverApiHeaders(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (isNoAnswer(res.status)) return undefined;
    if (!res.ok) return MISS;
    const json = await res.json().catch(() => null);
    const data = json?.data;
    if (data?.exists && typeof data.slug === "string") {
      return {
        slug: data.slug,
        canonicalHost: typeof data.canonicalHost === "string" ? data.canonicalHost : null,
      };
    }
    return MISS;
  } catch {
    return undefined;
  }
}

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

  const fresh = await ask(query);
  // No answer: keep the last real one (expired or not) and retry soon.
  const entry: Entry = fresh
    ? { answer: fresh, expiresAt: now + HIT_TTL_MS, known: true }
    : cached?.known
      ? { ...cached, expiresAt: now + ERROR_TTL_MS }
      : { answer: MISS, expiresAt: now + ERROR_TTL_MS, known: false };

  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(cacheKey, entry);
  return entry.answer;
}

/**
 * Whether the last lookup for `host` failed with no earlier answer to fall back
 * on — "could not tell", as opposed to "not a store". Only meaningful right
 * after `lookupStoreByHost(host)`, which is how the proxy uses it.
 */
export function isHostLookupUnavailable(host: string): boolean {
  const entry = cache.get(`h:${host}`);
  return !!entry && !entry.known;
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

/**
 * Whether a workspace with this slug exists: `true`, `false`, or `null` when the
 * API gave no answer and none was cached ("could not tell" — the proxy must then
 * serve the request as before, never 404 a real store over a backend blip).
 * Shares the cache entry with `lookupCanonicalHostBySlug`, so a real store pays
 * no extra fetch, and a scanner's invented slug costs one per minute, not one
 * per request.
 */
export async function lookupWorkspaceExists(
  slug: string,
): Promise<boolean | null> {
  const answer = await bySlug(slug);
  if (!cache.get(`s:${slug}`)?.known) return null;
  return answer.slug !== null;
}
