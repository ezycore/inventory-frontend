import { describe, expect, it } from "vitest";
import {
  catalogInfiniteParams,
  catalogSearchParams,
  isIndexableCatalogUrl,
  optionParams,
} from "@/lib/storefront-catalog-params";

describe("catalog params — variant options and the default sort", () => {
  it("reads opt.* off a server page's raw params, first value of a repeat", () => {
    const sp = catalogSearchParams({ "opt.Size": ["M,L", "XL"], brandId: "a,b", junk: "x" });
    expect(sp.options).toEqual({ "opt.Size": "M,L" });
    expect(sp.brandId).toBe("a,b");
  });

  it("the server seed and the client build the same request params", () => {
    // Server: raw Next params. Client: the URL's entries. Same key both ways.
    const server = catalogInfiniteParams(catalogSearchParams({ "opt.Size": "M" }));
    const client = catalogInfiniteParams({
      options: optionParams(new URLSearchParams("opt.Size=M").entries()),
    });
    expect(server).toEqual(client);
    expect(server).toMatchObject({ "opt.Size": "M" });
  });

  it("applies the merchant's default sort only when the URL names none", () => {
    expect(catalogInfiniteParams({ defaultSort: "newest" }).sort).toBe("newest");
    expect(catalogInfiniteParams({ sort: "price_asc", defaultSort: "newest" }).sort).toBe("price_asc");
    // `featured` is the backend's own default: never sent, so an untouched
    // shop keeps the exact cache key it always had.
    expect(catalogInfiniteParams({ defaultSort: "featured" }).sort).toBeUndefined();
  });

  it("a default sort leaves the page indexable; options and multi-brand do not", () => {
    expect(isIndexableCatalogUrl({ defaultSort: "newest" })).toBe(true);
    expect(isIndexableCatalogUrl({ options: { "opt.Size": "M" } })).toBe(false);
    expect(isIndexableCatalogUrl({ brandId: "a,b" })).toBe(false);
    expect(isIndexableCatalogUrl({ brandId: "a" })).toBe(true);
  });
});
