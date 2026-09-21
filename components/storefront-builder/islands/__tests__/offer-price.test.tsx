// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { OfferPriceIsland } from "@/components/storefront-builder/islands/offer-price";

vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: { fromPrice: "From", campaignOff: "off", outOfStock: "Out of stock" } }),
}));

const product = (overrides: Partial<CatalogProduct> = {}) =>
  ({
    _id: "p1",
    name: "Jamdani saree",
    slug: "jamdani",
    price: 900,
    compareAtPrice: 1200,
    productType: "simple",
    availableQuantity: 5,
    outOfStockBehavior: "show",
    images: [],
    ...overrides,
  }) as CatalogProduct;

const text = (p: CatalogProduct) => render(<OfferPriceIsland product={p} currency="BDT" />).container.textContent;

describe("OfferPriceIsland", () => {
  it("shows the price, the struck original and the discount in the shopper's words", () => {
    const shown = text(product());
    expect(shown).toContain("900");
    expect(shown).toContain("1,200");
    expect(shown).toContain("25% off");
    expect(shown).not.toContain("From");
    expect(shown).not.toContain("Out of stock");
  });

  it("says From for a variable product, and no discount when there is none", () => {
    const shown = text(product({ productType: "variable", compareAtPrice: null }));
    expect(shown).toContain("From");
    expect(shown).not.toContain("off");
  });

  it("says Out of stock once it has sold out, but never for a backorder product", () => {
    expect(text(product({ availableQuantity: 0 }))).toContain("Out of stock");
    expect(text(product({ availableQuantity: 0, outOfStockBehavior: "backorder" }))).not.toContain(
      "Out of stock",
    );
  });
});
