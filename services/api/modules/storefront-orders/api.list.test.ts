// coding-standard: maintained
/**
 * `list()` builds its query string key by key, so a filter the page passes but
 * this list forgets is silently dropped: the button lights up, the URL changes,
 * and the server answers with every order. That is how "Courier says returned"
 * and "Returns" shipped (1.4.0) — found live on UriiBaba, 2026-10-10.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiClient: client }));

import { storefrontOrdersApi } from "./api";

const queryOf = () => new URL(client.get.mock.calls[0][0], "http://x").searchParams;

beforeEach(() => {
  client.get.mockReset();
  client.get.mockResolvedValue({ success: true, data: { items: [] } });
});

describe("storefrontOrdersApi.list", () => {
  it("sends the courier-returned queue filter", async () => {
    await storefrontOrdersApi.list({ courierReturned: "true", page: 1 });
    expect(queryOf().get("courierReturned")).toBe("true");
  });

  it("sends the has-returns filter", async () => {
    await storefrontOrdersApi.list({ hasReturns: "true", page: 1 });
    expect(queryOf().get("hasReturns")).toBe("true");
  });

  it("leaves both off when the page does not ask", async () => {
    await storefrontOrdersApi.list({ page: 1 });
    expect(queryOf().has("courierReturned")).toBe(false);
    expect(queryOf().has("hasReturns")).toBe(false);
  });
});
