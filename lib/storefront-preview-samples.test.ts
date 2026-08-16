import { describe, expect, it } from "vitest";
import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import {
  PREVIEW_MIN_PRODUCTS,
  padCampaignsForPreview,
  padCategoriesForPreview,
  padForPreview,
  padStoreForPreview,
} from "@/lib/storefront-preview-samples";

const product = (n: number) =>
  ({
    _id: `real-${n}`,
    name: `Real product ${n}`,
    slug: `real-${n}`,
    price: 100,
    images: [{ url: "https://cdn.test/a.webp" }],
  }) as unknown as CatalogProduct;

const many = (n: number) => Array.from({ length: n }, (_, i) => product(i));

describe("padForPreview", () => {
  it("leaves a full catalogue alone", () => {
    const full = many(PREVIEW_MIN_PRODUCTS);
    expect(padForPreview(full)).toBe(full);
  });

  // An empty shop's emptiness is real and worth seeing — and a section that
  // hides itself on no data is behaving correctly, not failing.
  it("leaves an empty catalogue empty", () => {
    expect(padForPreview([])).toEqual([]);
  });

  it("pads a thin catalogue up to the minimum", () => {
    expect(padForPreview(many(3))).toHaveLength(PREVIEW_MIN_PRODUCTS);
  });

  // The merchant's own products must come first and survive untouched — the
  // preview is still meant to be their shop.
  it("never displaces or reorders the real products", () => {
    const real = many(3);
    const padded = padForPreview(real);
    expect(padded.slice(0, 3)).toEqual(real);
  });

  it("makes every placeholder obviously fake", () => {
    const padded = padForPreview(many(2));
    const filler = padded.slice(2);
    expect(filler.length).toBeGreaterThan(0);
    for (const f of filler) {
      expect(f.name).toMatch(/^Sample/);
      expect(f._id).toMatch(/^preview-sample-/);
      // Borrowing a real photograph is what would make a fake look real.
      expect(f.images).toEqual([]);
    }
  });

  it("gives every card a distinct key", () => {
    const padded = padForPreview(many(1));
    expect(new Set(padded.map((p) => p._id)).size).toBe(padded.length);
  });
});

describe("padCategoriesForPreview", () => {
  // The most load-bearing of the set: `RailShell` returns null without
  // categories, so a new merchant compared themes with the rail invisible.
  it("supplies departments when the shop has none", () => {
    expect(padCategoriesForPreview([]).length).toBeGreaterThanOrEqual(4);
  });

  it("never replaces a real taxonomy", () => {
    const real = [{ _id: "c1", name: "Medicines" }] as unknown as CatalogCategory[];
    expect(padCategoriesForPreview(real)).toBe(real);
  });

  it("gives every sample a routable-looking but synthetic id", () => {
    for (const c of padCategoriesForPreview([])) {
      expect(c._id).toMatch(/^preview-cat-/);
    }
  });
});

describe("padCampaignsForPreview", () => {
  it("supplies one when nothing is running", () => {
    expect(padCampaignsForPreview([])).toHaveLength(1);
  });

  // Overwriting a live discount with a fake one would be worse than a blank strip.
  it("never replaces a real campaign", () => {
    const real = [{ _id: "x", name: "Eid Sale" }] as unknown as StoreCampaign[];
    expect(padCampaignsForPreview(real)).toBe(real);
  });
});

describe("padStoreForPreview", () => {
  it("supplies promises when the merchant has written none", () => {
    const store = { trustBadges: [] } as unknown as StorefrontStore;
    expect(padStoreForPreview(store).trustBadges).toHaveLength(3);
  });

  it("never replaces the merchant's own promises", () => {
    const store = {
      trustBadges: [{ text: "Free delivery", icon: "truck" }],
    } as unknown as StorefrontStore;
    expect(padStoreForPreview(store)).toBe(store);
  });

  it("treats blank badges as none", () => {
    const store = { trustBadges: [{ text: "   " }] } as unknown as StorefrontStore;
    expect(padStoreForPreview(store).trustBadges?.[0]?.text).toMatch(/^Sample/);
  });
});
