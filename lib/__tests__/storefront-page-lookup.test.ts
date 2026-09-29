// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reply = (status: number) => new Response(status === 200 ? "{}" : null, { status });

/** A fresh module and an empty cache per test — the cache lives on `globalThis`. */
async function load(responses: Record<string, number | Error>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    const key = url.endsWith("/page?path=%2F") ? "home" : "builder";
    const outcome = responses[key];
    if (outcome instanceof Error) throw outcome;
    return reply(outcome ?? 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  Reflect.deleteProperty(globalThis, Symbol.for("ezycore.storefront-page-lookup"));
  vi.resetModules();
  const lookup = await import("@/lib/storefront-page-lookup");
  return { ...lookup, fetchMock };
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

  it("never caches a miss, so a page published a moment later is served at once", async () => {
    const { storePageExists, fetchMock } = await load({ builder: 404 });
    expect(await storePageExists("rafi5", "soon")).toBe(false);
    expect(await storePageExists("rafi5", "soon")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("answers yes while the API fails, so cached pages keep serving", async () => {
    const down = await load({ builder: 503 });
    expect(await down.storePageExists("rafi5", "about")).toBe(true);

    const unreachable = await load({ builder: new Error("ECONNREFUSED") });
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

describe("storeHomePageExists", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.unstubAllGlobals());

  it("asks the page read for / and remembers the homepage", async () => {
    const { storeHomePageExists, fetchMock } = await load({ home: 200 });
    expect(await storeHomePageExists("rafi5")).toBe(true);
    expect(await storeHomePageExists("rafi5")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/storefront/rafi5/page?path=%2F");
  });

  it("remembers that there is none for 15 seconds, since every visit to / asks", async () => {
    vi.useFakeTimers();
    const { storeHomePageExists, fetchMock } = await load({ home: 404 });
    expect(await storeHomePageExists("rafi5")).toBe(false);
    expect(await storeHomePageExists("rafi5")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(16_000);
    await storeHomePageExists("rafi5");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // "No" is a 404, so a
  // backend blip keeps the cached home route serving what it already has.
  it("keeps the home while the API fails", async () => {
    const down = await load({ home: 503 });
    expect(await down.storeHomePageExists("rafi5")).toBe(true);
    const unreachable = await load({ home: new Error("ECONNREFUSED") });
    expect(await unreachable.storeHomePageExists("rafi5")).toBe(true);
    const preview = await load({ home: 503 });
    expect(await preview.storeHomePageExists("rafi5", "token-1")).toBe(true);
  });

  it("asks as the owner under preview, and never remembers that answer", async () => {
    const { storeHomePageExists, fetchMock } = await load({ home: 200 });
    expect(await storeHomePageExists("rafi5", "token-1")).toBe(true);
    expect(await storeHomePageExists("rafi5", "token-1")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ "x-storefront-preview": "token-1" });
  });
});

describe("forgetStoreLookups", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("drops one store's pages and homepage, and no other store's", async () => {
    const { storePageExists, storeHomePageExists, forgetStoreLookups, fetchMock } = await load({
      builder: 200,
      home: 404,
    });
    await storePageExists("rafi5", "eid");
    await storeHomePageExists("rafi5");
    await storePageExists("other", "eid");
    expect(fetchMock).toHaveBeenCalledTimes(3);

    forgetStoreLookups("rafi5");
    await storePageExists("rafi5", "eid");
    await storeHomePageExists("rafi5");
    await storePageExists("other", "eid");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
