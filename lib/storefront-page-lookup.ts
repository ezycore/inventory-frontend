// coding-standard: maintained
/**
 * Does this store serve a page at `/pages/<slug>`? Asked by `proxy.ts` before
 * it sends a request to the cached `/sites` route.
 *
 * **Why the proxy has to know.** A cached (ISR) render that calls `notFound()`
 * cannot draw the storefront's own 404: Next 16.1 answers it with its bare error
 * document — the status is a correct 404, but there is no shop and no way back.
 * A nested `not-found.tsx` never renders on that path (tried with a client and
 * a server one, 2026-09-14). The request-reading `shop/pages/[pageSlug]` route
 * renders the real 404 inside the store's chrome, so only pages that exist are
 * sent to the cache and everything else stays where a 404 looks like the shop.
 *
 * Asks the two public endpoints the cached route renders from: the builder page
 * (a rename redirect counts — the cached route answers it with a 308), then the
 * content page.
 *
 * Caching, per instance:
 *  - **"exists" for 60s.** A page deleted inside that window gets the bare 404
 *    for at most a minute.
 *  - **A miss is never cached,** so a page published a second ago is served at
 *    once, and a dead link always gets the shop's 404.
 *  - **An API failure answers "exists", for 10s.** The cached route can still
 *    serve the HTML it already has while the backend blips; the request-reading
 *    route could serve nothing. Short enough that recovery is quick.
 *
 * Never throws.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const HIT_TTL_MS = 60_000;
const ERROR_TTL_MS = 10_000;
const MAX_ENTRIES = 2_000;
const FETCH_TIMEOUT_MS = 3_000;

const cache = new Map<string, number>();

type Probe = "found" | "missing" | "error";

async function probe(url: string): Promise<Probe> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) return "found";
    return res.status === 404 ? "missing" : "error";
  } catch {
    return "error";
  }
}

const remember = (key: string, ttl: number) => {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, Date.now() + ttl);
};

export async function storePageExists(slug: string, pageSlug: string): Promise<boolean> {
  const key = `${slug}/${pageSlug}`;
  const expiresAt = cache.get(key);
  if (expiresAt && expiresAt > Date.now()) return true;

  const store = `${API_BASE}/storefront/${encodeURIComponent(slug)}`;
  const builder = await probe(`${store}/page?path=${encodeURIComponent(`/pages/${pageSlug}`)}`);
  const answer = builder === "found" ? builder : await probe(`${store}/pages/${pageSlug}`);

  if (answer === "found") remember(key, HIT_TTL_MS);
  else if (answer === "error" || builder === "error") remember(key, ERROR_TTL_MS);
  return answer !== "missing" || builder === "error";
}
