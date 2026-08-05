// coding-standard: maintained
/**
 * `POST /api/storefront/revalidate` — flush the public storefront's server-side
 * caches for the caller's own store, on demand.
 *
 * Why this exists: every server fetch in `lib/storefront-server.ts` is tagged
 * `store:{slug}`, but until now **nothing ever called `revalidateTag`** — the tag
 * was inert wiring and time expiry (`getStore` = 300s, the shop routes' own
 * `export const revalidate`) was the only thing that ever refreshed a store. So a
 * merchant who changed their theme colour saw it up to five minutes later, and no
 * amount of hard-reloading helped: the stale copy lives in the Next server's Data
 * Cache and Full Route Cache, which are shared across every visitor and completely
 * out of reach of a browser cache-control header.
 *
 * The slug is **never taken from the request** — it is read off the caller's own
 * session via the backend's `/auth/me`. A client-supplied slug would let anyone
 * flush any tenant's cache on demand, which is a free way to strip a competitor of
 * their ISR. The bearer token is the only input, so the worst a valid caller can do
 * is expire their own store.
 *
 * Called by `lib/revalidate-storefront.ts` from admin mutations. Deployment note:
 * `revalidateTag` reaches the cache of the instance that serves the request, so a
 * multi-replica deployment needs a shared `cacheHandler` for this to be global.
 */
import { createHash } from "crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

/**
 * A small per-token throttle. Every call costs a backend `/auth/me` round trip
 * before it can even be authorized, so an unbounded caller turns one save button
 * into a load generator against the API — and the flush itself is idempotent,
 * making a burst pure waste.
 *
 * In-memory and per-instance on purpose: the thing being protected (the Next
 * server's own Data Cache) is per-instance too, so a shared store would add a
 * dependency without protecting anything extra. Keyed by a HASH of the token —
 * the raw bearer never becomes a map key that could surface in a heap dump.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function throttled(token: string): boolean {
  const key = createHash("sha256").update(token).digest("hex");
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    // Sweep on write: without this the map grows one entry per token forever,
    // which on a long-lived server is a slow leak rather than a rate limiter.
    for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

/** Resolve the caller's store slug from their admin session — the trust boundary. */
async function slugForToken(token: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    // Without this, an unreachable backend holds the request open until the OS
    // gives up on the socket — minutes, during which the context can't be
    // collected. The caller is a fire-and-forget cache flush, so failing fast
    // costs nothing: the tag still expires on its own timer.
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data?.user?.organization?.slug ?? null;
}

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  // Header-only, deliberately: the admin's `auth-token` cookie is same-site, so
  // accepting it would make this endpoint CSRF-triggerable. A header requires JS
  // running on our own origin.
  if (!token) return fail("Unauthorized", 401);

  // Checked BEFORE `/auth/me`, or the throttle would still pay the round trip it
  // exists to prevent.
  if (throttled(token)) return fail("Too many requests", 429);

  let slug: string | null;
  try {
    slug = await slugForToken(token);
  } catch {
    // Also the timeout path — an unreachable or slow backend, not a bad caller.
    return fail("Could not verify the session", 504);
  }
  if (!slug) return fail("Unauthorized", 401);

  // `{ expire: 0 }` = expire now, with no stale-while-revalidate window. The
  // default profile ("max") would let the next request still serve the stale copy
  // and only refresh in the background — i.e. the merchant would have to reload
  // twice to see their own save, which is the complaint this endpoint answers.
  revalidateTag(`store:${slug}`, { expire: 0 });

  return NextResponse.json({ success: true, data: { slug } });
}
