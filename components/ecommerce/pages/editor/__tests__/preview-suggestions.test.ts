import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { previewSuggestions } from "../preview-suggestions";

const product = (id: string, over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  _id: id,
  name: `Product ${id}`,
  slug: `product-${id}`,
  price: 100,
  basePrice: 100,
  images: [],
  description: "",
  featured: false,
  productType: "single",
  availableQuantity: 5,
  ...over,
});

const LONG = "word ".repeat(80);

describe("previewSuggestions", () => {
  it("picks the first product of each kind, in a fixed order", () => {
    const suggestions = previewSuggestions([
      product("plain"),
      product("sold-out", { availableQuantity: 0 }),
      product("long", { description: LONG }),
      product("options", { hasVariants: true }),
      product("options-2", { hasVariants: true }),
    ]);
    expect(suggestions.map(({ product: { _id }, reason }) => [_id, reason])).toEqual([
      ["options", "Has options"],
      ["long", "Long description"],
      ["sold-out", "Sold out"],
    ]);
  });

  it("never suggests one product twice", () => {
    const suggestions = previewSuggestions([
      product("all", { hasVariants: true, description: LONG, availableQuantity: 0 }),
      product("long", { description: LONG }),
    ]);
    expect(suggestions.map(({ product: { _id } }) => _id)).toEqual(["all", "long"]);
  });

  it("does not call a backorder product sold out", () => {
    expect(
      previewSuggestions([product("back", { availableQuantity: 0, outOfStockBehavior: "backorder" })]),
    ).toEqual([]);
  });

  it("does not call an untracked product sold out", () => {
    expect(previewSuggestions([product("untracked", { availableQuantity: Number.MAX_SAFE_INTEGER })])).toEqual([]);
  });

  it("suggests nothing for a catalogue with nothing unusual", () => {
    expect(previewSuggestions([product("a"), product("b")])).toEqual([]);
  });
});
