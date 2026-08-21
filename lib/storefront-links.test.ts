import { describe, expect, it } from "vitest";
import { normalizeStoreLink, storeLinkHref } from "./storefront-links";

describe("owner-entered storefront links", () => {
  it("removes the legacy tenant prefix before applying the active base", () => {
    expect(storeLinkHref("/shop", "/shop")).toBe("/shop");
    expect(storeLinkHref("/shop", "/shop/products?q=rice")).toBe("/shop/products?q=rice");
    expect(storeLinkHref("", "/shop/products")).toBe("/products");
  });
  it("accepts store paths and http links", () => {
    expect(storeLinkHref("/shop", "products")).toBe("/shop/products");
    expect(storeLinkHref("/shop", "https://example.com/sale")).toBe("https://example.com/sale");
  });
  it("does not emit unsafe schemes", () => {
    expect(normalizeStoreLink("javascript:alert(1)")).toBe("/products");
    expect(normalizeStoreLink("//example.com")).toBe("/products");
  });
});
