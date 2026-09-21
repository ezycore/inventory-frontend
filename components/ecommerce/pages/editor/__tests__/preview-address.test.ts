// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { StorefrontPage } from "@/services/api";
import { needsBuilderParam, previewAddress } from "../preview-address";

const system = (systemKey: NonNullable<StorefrontPage["systemKey"]>) => ({
  kind: "system" as const,
  systemKey,
  slug: undefined,
});

describe("previewAddress", () => {
  it("previews content and landing pages at /pages/<slug>", () => {
    expect(previewAddress({ kind: "content", systemKey: undefined, slug: "about" })).toBe("/pages/about");
    expect(previewAddress({ kind: "landing", systemKey: undefined, slug: "eid" })).toBe("/pages/eid");
  });

  it("previews every movable system page at its own route", () => {
    // Each of these editors showed "Store address unavailable." before 2026-09-16.
    expect(previewAddress(system("home"))).toBe("/");
    expect(previewAddress(system("collection"))).toBe("/products");
    expect(previewAddress(system("search"))).toBe("/search");
    expect(previewAddress(system("cart"))).toBe("/cart");
    expect(previewAddress(system("checkout"))).toBe("/checkout");
    expect(previewAddress(system("account"))).toBe("/account");
  });

  it("previews the product page around a real product, and not without one", () => {
    expect(previewAddress(system("product"), "blue-shirt")).toBe("/products/blue-shirt");
    expect(previewAddress(system("product"), null)).toBeNull();
    expect(previewAddress(system("product"))).toBeNull();
  });

  it("previews a campaign page at its CAMPAIGN's address", () => {
    // The one kind with no slug of its own: it is served at the campaign's
    // address, so reading `page.slug` found nothing and the editor showed
    // "Store address unavailable." on every campaign page (found in browser QA).
    expect(
      previewAddress({
        kind: "campaign",
        systemKey: undefined,
        slug: undefined,
        campaignSlug: "eid-sale",
      }),
    ).toBe("/campaigns/eid-sale");
    // A campaign deleted out from under its page has no address to preview.
    expect(
      previewAddress({
        kind: "campaign",
        systemKey: undefined,
        slug: undefined,
        campaignSlug: null,
      }),
    ).toBeNull();
  });

  it("has no address for a page it cannot place", () => {
    expect(previewAddress(system("not-found"))).toBeNull();
    expect(previewAddress({ kind: "landing", systemKey: undefined, slug: undefined })).toBeNull();
  });
});

describe("needsBuilderParam", () => {
  it("asks for the builder page at a campaign address", () => {
    // That address also draws the campaign's DEFAULT banner and grid, so the
    // editor has to say it wants the builder page.
    expect(needsBuilderParam("/campaigns/eid-sale")).toBe(true);
  });

  it("asks for the builder page wherever Customize could also be previewing", () => {
    expect(needsBuilderParam("/")).toBe(true);
    expect(needsBuilderParam("/cart")).toBe(true);
    expect(needsBuilderParam("/products/blue-shirt")).toBe(true);
    expect(needsBuilderParam("/pages/about")).toBe(false);
  });
});
