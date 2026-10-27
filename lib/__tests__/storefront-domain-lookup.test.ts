// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * On 2026-10-23 the backend's rate limit ran out and `store-by-host` answered
 * 429. The lookup read that as "not a store", and the proxy sent uriibaba.com's
 * shoppers to the admin login. These pin "could not tell" apart from "no".
 */

/** A status, a thrown error, "absent" (exists:false), or a store answer. */
type Outcome = number | Error | "absent" | { slug: string; canonicalHost?: string | null };

const STORE = { slug: "uriibaba", canonicalHost: null };

/** A fresh module (and so an empty cache) whose fetch plays `outcomes` in order. */
async function load(...outcomes: Outcome[]) {
  const queue = [...outcomes];
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    if (next instanceof Error) throw next;
    if (typeof next === "number") return new Response(null, { status: next });
    const data = next === "absent" ? { exists: false } : { exists: true, ...next };
    return new Response(JSON.stringify({ data }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
  const lookup = await import("@/lib/storefront-domain-lookup");
  return { ...lookup, fetchMock };
}

describe("storefront domain lookup", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.unstubAllGlobals());

  it("resolves a custom domain to its store", async () => {
    const { lookupStoreByHost, isHostLookupUnavailable } = await load(STORE);
    expect(await lookupStoreByHost("uriibaba.com")).toBe("uriibaba");
    expect(isHostLookupUnavailable("uriibaba.com")).toBe(false);
  });

  it("reads exists:false as a definite 'not a store'", async () => {
    const { lookupStoreByHost, isHostLookupUnavailable } = await load("absent");
    expect(await lookupStoreByHost("nobody.com")).toBeNull();
    expect(isHostLookupUnavailable("nobody.com")).toBe(false);
  });

  it("flags a rate limit or an outage with no earlier answer as 'could not tell'", async () => {
    for (const failure of [429, 503, new Error("ECONNREFUSED")]) {
      const { lookupStoreByHost, isHostLookupUnavailable } = await load(failure);
      expect(await lookupStoreByHost("uriibaba.com")).toBeNull();
      expect(isHostLookupUnavailable("uriibaba.com")).toBe(true);
    }
  });

  it("keeps serving the last real answer while the API gives none", async () => {
    vi.useFakeTimers();
    const { lookupStoreByHost, isHostLookupUnavailable, fetchMock } = await load(STORE, 429);
    expect(await lookupStoreByHost("uriibaba.com")).toBe("uriibaba");

    vi.advanceTimersByTime(61_000);
    expect(await lookupStoreByHost("uriibaba.com")).toBe("uriibaba");
    expect(isHostLookupUnavailable("uriibaba.com")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a failed lookup after 10s and recovers", async () => {
    vi.useFakeTimers();
    const { lookupStoreByHost, isHostLookupUnavailable } = await load(429, STORE);
    expect(await lookupStoreByHost("uriibaba.com")).toBeNull();

    vi.advanceTimersByTime(11_000);
    expect(await lookupStoreByHost("uriibaba.com")).toBe("uriibaba");
    expect(isHostLookupUnavailable("uriibaba.com")).toBe(false);
  });

  it("sends the server key so the backend's per-IP limiter skips it", async () => {
    vi.stubEnv("SSR_API_KEY", "k".repeat(40));
    const { lookupStoreByHost, fetchMock } = await load(STORE);
    await lookupStoreByHost("uriibaba.com");
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["x-ezycore-ssr-key"]).toBe("k".repeat(40));
    vi.unstubAllEnvs();
  });
});

/**
 * Scanners invent `*.ezycore.com` names by the hundred; the proxy 404s a slug
 * the backend says does not exist. A backend blip must never read as "absent".
 */
describe("workspace exists lookup", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.unstubAllGlobals());

  it("answers true for a real workspace", async () => {
    const { lookupWorkspaceExists } = await load(STORE);
    expect(await lookupWorkspaceExists("uriibaba")).toBe(true);
  });

  it("answers false for an invented slug", async () => {
    const { lookupWorkspaceExists } = await load("absent");
    expect(await lookupWorkspaceExists("exchange")).toBe(false);
  });

  it("answers null, never false, when the API gives no answer", async () => {
    for (const failure of [429, 503, new Error("ECONNREFUSED")]) {
      const { lookupWorkspaceExists } = await load(failure);
      expect(await lookupWorkspaceExists("uriibaba")).toBeNull();
    }
  });

  it("asks once per minute per slug, however often a scanner repeats it", async () => {
    const { lookupWorkspaceExists, fetchMock } = await load("absent");
    for (let i = 0; i < 5; i++) await lookupWorkspaceExists("exchange");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares the entry with the canonical-host lookup, so a real store pays no extra fetch", async () => {
    const { lookupWorkspaceExists, lookupCanonicalHostBySlug, fetchMock } = await load(STORE);
    await lookupWorkspaceExists("uriibaba");
    await lookupCanonicalHostBySlug("uriibaba");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
