import { describe, expect, it } from "vitest";
import { merchantLinkHref, normalizeStoreLink, storeLinkHref } from "./storefront-links";

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

describe("a link to another section of the same page", () => {
  it("is kept exactly as typed", () => {
    // Before 2026-09-21 this fell through to `storeLinkHref`, whose fallback is
    // the catalogue — so "scroll down to the order form" became a page load of
    // /products, which is the opposite of what the merchant asked for.
    expect(merchantLinkHref("/shop", "#order-form")).toBe("#order-form");
    expect(merchantLinkHref("", "#order-form")).toBe("#order-form");
    expect(merchantLinkHref("/shop", "  #reviews  ")).toBe("#reviews");
  });

  it("accepts only what a section can actually be named", () => {
    // Anything else names no section, so it is not kept as a same-page jump —
    // it goes back through `storeLinkHref` and is treated as a store path. The
    // backend refuses these as section links anyway, so they cannot be saved;
    // this is about what the renderer does with one that somehow arrives.
    for (const link of ["#Order-Form", "#-leading", "#", "#a b"]) {
      expect(merchantLinkHref("/shop", link)).not.toBe(link);
      expect(merchantLinkHref("/shop", link).startsWith("/shop")).toBe(true);
    }
  });
});
