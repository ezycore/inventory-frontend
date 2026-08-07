import { describe, expect, it } from "vitest";
import { buildQueryParams } from "../utils";

/**
 * These pin the wire format the list endpoints actually read. Every case below
 * is a bug that shipped: arrays were JSON-encoded, so the multi-select tag
 * filters on products and inventory looked applied (chip lit, count badge set)
 * while the request 500'd on `new ObjectId('["…"]')` and the table quietly kept
 * showing the previous, unfiltered page.
 */
describe("buildQueryParams", () => {
  it("emits an array as a repeated key, not JSON", () => {
    const qs = buildQueryParams({ tags: ["a", "b"] });
    expect(qs).toBe("?tags=a&tags=b");
  });

  it("keeps a single-element array in repeated form", () => {
    expect(buildQueryParams({ tags: ["a"] })).toBe("?tags=a");
  });

  it("drops an empty array entirely", () => {
    // No key at all — the same "no filter" the callers mean by omitting it.
    expect(buildQueryParams({ tags: [], page: 1 })).toBe("?page=1");
  });

  it("drops empty entries inside an array", () => {
    expect(buildQueryParams({ tags: ["a", "", "b"] })).toBe("?tags=a&tags=b");
  });

  it("still JSON-encodes a non-array object", () => {
    // Date ranges rely on this; only the array branch changed.
    const qs = buildQueryParams({ createdAt: { from: "2026-01-01" } });
    expect(qs).toBe(`?createdAt=${encodeURIComponent('{"from":"2026-01-01"}')}`);
  });

  it("passes scalars through and skips empty ones", () => {
    expect(buildQueryParams({ page: 1, search: "", status: "active" })).toBe(
      "?page=1&status=active",
    );
  });

  it("returns an empty string when nothing is active", () => {
    expect(buildQueryParams({})).toBe("");
    expect(buildQueryParams({ search: "", tags: [] })).toBe("");
  });
});
