// coding-standard: maintained
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storefront-host", () => ({ getStorePreviewToken: async () => null }));

import {
  StorefrontUnavailableError,
  getStore,
  publicStorefront,
} from "@/lib/storefront-server";

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
});
