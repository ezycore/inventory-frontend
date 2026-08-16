import { describe, expect, it } from "vitest";
import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import {
  APPAREL_SAMPLE,
  PHARMACY_SAMPLE,
} from "@/lib/storefront-theme-samples";
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

  // The case the whole feature exists for: a merchant with nothing yet is
  // exactly the one comparing themes, and blank grids told them nothing.
  it("fills an empty catalogue", () => {
    expect(padForPreview([])).toHaveLength(PREVIEW_MIN_PRODUCTS);
  });

  it("dresses an empty catalogue in the previewed theme's trade", () => {
    const names = padForPreview([], PHARMACY_SAMPLE).map((p) => p.name);
    expect(names.join(" ")).toMatch(/syrup|tablets|capsules/i);
    expect(names.join(" ")).not.toMatch(/rice|saree/i);
  });

  // With no product to clone there is no shape to borrow, so the fields a card
  // reads have to be spelled out or the grid renders broken tiles.
  it("builds a card-shaped product with nothing to clone from", () => {
    const [first] = padForPreview([]);
    expect(first.price).toBeGreaterThan(0);
    expect(first.images[0]?.url).toMatch(/^\/samples\//);
    expect(first.availableQuantity).toBeGreaterThan(0);
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
      // The "Sample" prefix is what lets the rest of the content be realistic.
      expect(f.name).toMatch(/^Sample/);
      expect(f._id).toMatch(/^preview-sample-/);
      // An illustration, never the real product's photograph — borrowing that
      // is what would make the fake look real.
      expect(f.images[0]?.url).toMatch(/^\/samples\//);
    }
  });

  // Inheriting the cloned product's discount would price a placeholder against
  // a campaign it is not in, drawing a strike-through on invented stock.
  it("never inherits a real product's discount", () => {
    const real = [{ ...product(0), compareAtPrice: 999 }] as CatalogProduct[];
    for (const f of padForPreview(real).slice(1)) {
      expect(f.compareAtPrice).toBeNull();
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

  it("names departments after the previewed theme's trade", () => {
    expect(padCategoriesForPreview([], PHARMACY_SAMPLE)).toContainEqual(
      expect.objectContaining({ name: "Prescriptions" }),
    );
    expect(padCategoriesForPreview([], APPAREL_SAMPLE)).toContainEqual(
      expect.objectContaining({ name: "Sarees" }),
    );
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

  it("writes promises that suit the previewed theme", () => {
    const store = { trustBadges: [] } as unknown as StorefrontStore;
    const badges = padStoreForPreview(store, PHARMACY_SAMPLE).trustBadges ?? [];
    expect(badges.map((b) => b.text).join(" ")).toMatch(/pharmacy|medicines/i);
  });

  // A whitespace-only badge is a half-finished edit, not a promise — treating
  // it as one renders an empty tick in the band.
  it("treats blank badges as none", () => {
    const store = { trustBadges: [{ text: "   " }] } as unknown as StorefrontStore;
    const badges = padStoreForPreview(store).trustBadges ?? [];
    expect(badges).toHaveLength(3);
    expect(badges[0]?.text?.trim()).toBeTruthy();
  });
});
