// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { storefrontCacheTags, tagsToFlush } from "@/lib/storefront-cache-tags";

describe("storefrontCacheTags", () => {
  it("tags a fetch with the whole store and its scopes", () => {
    expect(storefrontCacheTags("rafi5", ["catalog"])).toEqual(["store:rafi5", "catalog:rafi5"]);
    expect(storefrontCacheTags("rafi5", ["catalog", "content"])).toEqual([
      "store:rafi5",
      "catalog:rafi5",
      "content:rafi5",
    ]);
  });
});

describe("tagsToFlush", () => {
  it("flushes only the named scopes", () => {
    expect(tagsToFlush("rafi5", ["catalog"])).toEqual(["catalog:rafi5"]);
    expect(tagsToFlush("rafi5", ["site", "content", "site"])).toEqual(["site:rafi5", "content:rafi5"]);
  });

  it("flushes the whole store when no scope is named", () => {
    expect(tagsToFlush("rafi5", undefined)).toEqual(["store:rafi5"]);
    expect(tagsToFlush("rafi5", [])).toEqual(["store:rafi5"]);
  });

  it("flushes the whole store rather than trust a malformed request", () => {
    expect(tagsToFlush("rafi5", ["catalog", "everything"])).toEqual(["store:rafi5"]);
    expect(tagsToFlush("rafi5", "catalog")).toEqual(["store:rafi5"]);
    expect(tagsToFlush("rafi5", [{ scope: "catalog" }])).toEqual(["store:rafi5"]);
  });
});
