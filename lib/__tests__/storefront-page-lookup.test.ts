// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reply = (status: number) => new Response(status === 200 ? "{}" : null, { status });

/** A fresh module per test — the lookup's cache lives in module memory. */
async function load(responses: Record<string, number | Error>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = url.includes("/page?path=") ? "builder" : "content";
    const outcome = responses[key];
    if (outcome instanceof Error) throw outcome;
    return reply(outcome ?? 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
  const { storePageExists } = await import("@/lib/storefront-page-lookup");
  return { storePageExists, fetchMock };
}

describe("storePageExists", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.unstubAllGlobals());

  it("finds a builder page with one call and remembers it", async () => {
    const { storePageExists, fetchMock } = await load({ builder: 200 });
    expect(await storePageExists("rafi5", "eid-sale")).toBe(true);
    expect(await storePageExists("rafi5", "eid-sale")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/storefront/rafi5/page?path=%2Fpages%2Feid-sale");
  });

  it("falls through to the content page", async () => {
    const { storePageExists, fetchMock } = await load({ builder: 404, content: 200 });
    expect(await storePageExists("rafi5", "about")).toBe(true);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/storefront/rafi5/pages/about");
  });

  it("never caches a miss, so a page published a moment later is served at once", async () => {
    const { storePageExists, fetchMock } = await load({ builder: 404, content: 404 });
    expect(await storePageExists("rafi5", "soon")).toBe(false);
    expect(await storePageExists("rafi5", "soon")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("answers yes while the API fails, so cached pages keep serving", async () => {
    const down = await load({ builder: 503, content: 404 });
    expect(await down.storePageExists("rafi5", "about")).toBe(true);

    const unreachable = await load({ builder: new Error("ECONNREFUSED"), content: new Error("ECONNREFUSED") });
    expect(await unreachable.storePageExists("rafi5", "about")).toBe(true);
  });

  it("expires a remembered page", async () => {
    vi.useFakeTimers();
    const { storePageExists, fetchMock } = await load({ builder: 200 });
    await storePageExists("rafi5", "eid-sale");
    vi.advanceTimersByTime(61_000);
    await storePageExists("rafi5", "eid-sale");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
