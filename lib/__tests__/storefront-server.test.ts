// coding-standard: maintained
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storefront-host", () => ({ getStorePreviewToken: async () => null }));

import {
  StorefrontUnavailableError,
  getStore,
  publicStorefront,
} from "@/lib/storefront-server";
import { isNoAnswer } from "@/lib/server-api";

const respond = (status: number, body: unknown = {}) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

const unreachable = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("fetch failed");
    }),
  );

describe("storefront server reads", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the payload the API sent", async () => {
    respond(200, { data: { name: "rafi5" } });
    await expect(publicStorefront.getStore("rafi5")).resolves.toEqual({ name: "rafi5" });
  });

  it("reads a 4xx as not there, on both sets", async () => {
    respond(404);
    await expect(publicStorefront.getStore("rafi5")).resolves.toBeNull();
    await expect(getStore("rafi5")).resolves.toBeNull();
  });

  it("throws from the cacheable set when the API gives no answer, so a cached page never stores a 404", async () => {
    respond(503);
    await expect(publicStorefront.getStore("rafi5")).rejects.toBeInstanceOf(StorefrontUnavailableError);
    unreachable();
    await expect(publicStorefront.getStorefrontPage("rafi5", "/pages/eid")).rejects.toBeInstanceOf(
      StorefrontUnavailableError,
    );
  });

  it("keeps the request-aware set forgiving: no answer reads as no data", async () => {
    unreachable();
    await expect(getStore("rafi5")).resolves.toBeNull();
    respond(502);
    await expect(getStore("rafi5")).resolves.toBeNull();
  });

  // The backend's limiter ran out on 2026-10-23 and its 429 was read as "no such
  // store": cached shop pages were stored as 404s while every store was live.
  it("reads a rate limit or a timeout as no answer, never as a missing store", async () => {
    for (const status of [429, 408]) {
      respond(status);
      await expect(publicStorefront.getStore("rafi5")).rejects.toBeInstanceOf(StorefrontUnavailableError);
    }
    expect(isNoAnswer(429)).toBe(true);
    expect(isNoAnswer(404)).toBe(false);
    expect(isNoAnswer(400)).toBe(false);
  });

  it("sends the server key when one is configured, and nothing when it is not", async () => {
    respond(200, { data: {} });
    vi.stubEnv("SSR_API_KEY", "k".repeat(40));
    await publicStorefront.getStore("rafi5");
    const sent = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(sent["x-ezycore-ssr-key"]).toBe("k".repeat(40));

    respond(200, { data: {} });
    vi.stubEnv("SSR_API_KEY", "");
    await publicStorefront.getStore("rafi5");
    const none = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(none).not.toHaveProperty("x-ezycore-ssr-key");
    vi.unstubAllEnvs();
  });
});
