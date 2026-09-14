// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag }));

import { POST } from "./route";

let tokenCount = 0;
/** A fresh token per request — the route throttles per token. */
const request = (body?: string, token: string | null = `token-${++tokenCount}`) =>
  new NextRequest("http://localhost/api/storefront/revalidate", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  });

describe("POST /api/storefront/revalidate", () => {
  beforeEach(() => {
    revalidateTag.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ data: { user: { organization: { slug: "rafi5" } } } }),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  const flushed = () => revalidateTag.mock.calls.map(([tag]) => tag);

  it("flushes only the scopes a save names", async () => {
    const res = await POST(request(JSON.stringify({ scopes: ["catalog", "content"] })));
    expect(res.status).toBe(200);
    expect(flushed()).toEqual(["catalog:rafi5", "content:rafi5"]);
    expect(revalidateTag).toHaveBeenCalledWith("catalog:rafi5", { expire: 0 });
  });

  it("flushes the whole store when no scope is named", async () => {
    await POST(request());
    expect(flushed()).toEqual(["store:rafi5"]);
  });

  it("flushes the whole store for a body it cannot trust", async () => {
    await POST(request("not json"));
    await POST(request(JSON.stringify({ scopes: ["catalog", "everything"] })));
    expect(flushed()).toEqual(["store:rafi5", "store:rafi5"]);
  });

  it("takes the store from the session, never from the body", async () => {
    await POST(request(JSON.stringify({ scopes: ["site"], slug: "someone-else" })));
    expect(flushed()).toEqual(["site:rafi5"]);
  });

  it("refuses a request without a bearer token", async () => {
    const res = await POST(request(undefined, null));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
