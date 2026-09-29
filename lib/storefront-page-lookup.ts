// coding-standard: maintained
/**
 * What `proxy.ts` asks before it sends a store request to a cached `/sites`
 * route: does this store serve a page at `/pages/<slug>` (`storePageExists`), and
 * does it have a home page to draw at its `/` (`storeHomePageExists`)?
 *
 * **Why the proxy has to know.** A cached (ISR) render that calls `notFound()`
 * cannot draw the storefront's own 404: Next 16.1 answers it with its bare error
 * document — the status is a correct 404, but there is no shop and no way back.
 * A nested `not-found.tsx` never renders on that path (tried with a client and
 * a server one, 2026-09-14). The request-reading `shop/pages/[pageSlug]` route
 * renders the real 404 inside the store's chrome, so only pages that exist are
 * sent to the cache and everything else stays where a 404 looks like the shop.
 *
 * The homepage is the same question about `/`: the store's `home` builder page,
 * or the landing page the merchant chose (backend `settings.homePageId`), both
 * answered by `GET /page?path=/`. A store with neither falls through to the
 * `shop` route, which answers 404.
 *
 * Asks the public endpoints the cached routes render from: the builder page (a
 * rename redirect counts — the cached route answers it with a 308), then the
 * content page.
 *
 * Caching, per instance:
 *  - **"exists" for 60s.** A page deleted inside that window gets the bare 404
 *    for at most a minute.
 *  - **A missing page is never cached,** so a page published a second ago is
 *    served at once, and a dead link always gets the shop's 404.
 *  - **"No homepage" for 15s.** Unlike a page address, every visit to a shop's
 *    front door asks, so a store without one is remembered too.
 *  - **An API failure** answers "exists", for 10s, for a page and the homepage
 *    alike: the cached route can still serve the HTML it has while the backend
 *    blips — "no" is a 404.
 *  - **An owner preview is never cached.** It asks with the owner's token, which
 *    can see a shop the public cannot.
 *
 * `forgetStoreLookups` drops one store's answers. The admin's cache flush
 * (`app/api/storefront/revalidate`) calls it, so a merchant's own publish, delete
 * or homepage change is seen at once. The map lives on `globalThis` so the proxy
 * and that route share it wherever they share a process; where they do not, the
 * times above are the bound.
 *
 * Never throws.
 */
import { PREVIEW_API_HEADER } from "@/lib/storefront-preview";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const HIT_TTL_MS = 60_000;
const NO_HOME_TTL_MS = 15_000;
const ERROR_TTL_MS = 10_000;
const MAX_ENTRIES = 2_000;
const FETCH_TIMEOUT_MS = 3_000;

interface Answer {
  exists: boolean;
  expiresAt: number;
}

const CACHE = Symbol.for("ezycore.storefront-page-lookup");
const shared = globalThis as typeof globalThis & { [CACHE]?: Map<string, Answer> };
const cache = (shared[CACHE] ??= new Map<string, Answer>());

type Probe = "found" | "missing" | "error";

async function probe(url: string, headers: Record<string, string> = {}): Promise<Probe> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) return "found";
    return res.status === 404 ? "missing" : "error";
  } catch {
    return "error";
  }
}

const storeApi = (slug: string) => `${API_BASE}/storefront/${encodeURIComponent(slug)}`;

const builderPageUrl = (slug: string, path: string) =>
  `${storeApi(slug)}/page?path=${encodeURIComponent(path)}`;

/** The remembered answer, or `undefined` when there is none or it has expired. */
const remembered = (key: string): boolean | undefined => {
  const answer = cache.get(key);
  return answer && answer.expiresAt > Date.now() ? answer.exists : undefined;
};

const remember = (key: string, exists: boolean, ttl: number) => {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, { exists, expiresAt: Date.now() + ttl });
};

export async function storePageExists(slug: string, pageSlug: string): Promise<boolean> {
  const key = `${slug}/${pageSlug}`;
  if (remembered(key)) return true;

  const answer = await probe(builderPageUrl(slug, `/pages/${pageSlug}`));
  if (answer === "found") remember(key, true, HIT_TTL_MS);
  else if (answer === "error") remember(key, true, ERROR_TTL_MS);
  return answer !== "missing";
}

/** Does this store have a home page at its `/`? Pass the owner's preview token to ask as them. */
export async function storeHomePageExists(
  slug: string,
  previewToken?: string | null,
): Promise<boolean> {
  const url = builderPageUrl(slug, "/");
  if (previewToken) {
    return (await probe(url, { [PREVIEW_API_HEADER]: previewToken })) !== "missing";
  }

  // No page slug is empty, so this key can only ever mean the homepage.
  const key = `${slug}/`;
  const known = remembered(key);
  if (known !== undefined) return known;

  const answer = await probe(url);
  const ttl = answer === "found" ? HIT_TTL_MS : answer === "missing" ? NO_HOME_TTL_MS : ERROR_TTL_MS;
  remember(key, answer !== "missing", ttl);
  return answer !== "missing";
}

/** Forget every answer about one store — its pages and its homepage. */
export function forgetStoreLookups(slug: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${slug}/`)) cache.delete(key);
  }
}
