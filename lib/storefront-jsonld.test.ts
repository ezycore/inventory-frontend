import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  productJsonLd,
  storeJsonLd,
} from "./storefront-jsonld";
import type { CatalogProduct, StorefrontStore } from "@/lib/storefront-client";

const store = {
  name: "Rashid's Mart",
  slug: "rmc41",
  currency: "BDT",
  allowedPaymentMethods: ["cod"],
  shippingRule: { mode: "flat", flatFee: 50 },
} as StorefrontStore;

const product = (over: Partial<CatalogProduct> = {}): CatalogProduct =>
  ({
    _id: "p1",
    name: "Drill Bit Set",
    slug: "drill-bit-set",
    price: 540,
    basePrice: 700,
    images: [{ url: "https://cdn.example.com/a.webp" }],
    description: "A set of drill bits.",
    featured: false,
    productType: "SINGLE",
    availableQuantity: 5,
    ...over,
  }) as CatalogProduct;

const URL_ = "https://shop.example.com/products/drill-bit-set";

describe("productJsonLd", () => {
  it("emits a single Offer with the store currency and the shown price", () => {
    const node = productJsonLd({ product: product(), store, url: URL_ });
    expect(node["@type"]).toBe("Product");
    expect(node.offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "BDT",
      price: 540,
      availability: "https://schema.org/InStock",
      url: URL_,
    });
  });

  // A zero would be a price claim the page never makes — invalid structured data
  // that disagrees with the page is a manual-action risk.
  it("emits NO offer when the price is null rather than inventing one", () => {
    const node = productJsonLd({
      product: product({ price: null }),
      store,
      url: URL_,
    });
    expect(node.offers).toBeUndefined();
    expect(JSON.stringify(node)).not.toContain("Offer");
  });

  it("spans variant prices with an AggregateOffer for a variable product", () => {
    const node = productJsonLd({
      product: product({
        productType: "VARIABLE",
        price: 540,
        variants: [
          { _id: "v1", label: "Wood", attributes: {}, price: 540, images: [], availableQuantity: 2 },
          { _id: "v2", label: "Metal", attributes: {}, price: 980, images: [], availableQuantity: 1 },
        ],
      }),
      store,
      url: URL_,
    });
    expect(node.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 540,
      highPrice: 980,
      offerCount: 2,
    });
  });

  // A variable product leaves `product.price` null and prices per variant, so a
  // single-variant one must still get an Offer — not silently none.
  it("emits a plain Offer for a one-variant product whose product.price is null", () => {
    const node = productJsonLd({
      product: product({
        productType: "VARIABLE",
        price: null,
        variants: [
          { _id: "v1", label: "Wood", attributes: {}, price: 600, images: [], availableQuantity: 3 },
        ],
      }),
      store,
      url: URL_,
    });
    expect(node.offers).toMatchObject({
      "@type": "Offer",
      price: 600,
      priceCurrency: "BDT",
    });
  });

  it("maps stock state: sold out vs backorder are different claims", () => {
    const soldOut = productJsonLd({
      product: product({ availableQuantity: 0 }),
      store,
      url: URL_,
    });
    expect((soldOut.offers as Record<string, unknown>).availability).toBe(
      "https://schema.org/OutOfStock",
    );

    const backorder = productJsonLd({
      product: product({ availableQuantity: 0, outOfStockBehavior: "backorder" }),
      store,
      url: URL_,
    });
    expect((backorder.offers as Record<string, unknown>).availability).toBe(
      "https://schema.org/BackOrder",
    );
  });

  it("keeps only absolute, de-duplicated image URLs", () => {
    const node = productJsonLd({
      product: product({
        images: [
          { url: "https://cdn.example.com/a.webp" },
          { url: "https://cdn.example.com/a.webp" },
          { url: "/relative/b.webp" },
          {},
        ],
      }),
      store,
      url: URL_,
    });
    expect(node.image).toEqual(["https://cdn.example.com/a.webp"]);
  });

  it("falls back to BDT when the store declares no currency", () => {
    const node = productJsonLd({
      product: product(),
      store: { ...store, currency: undefined } as StorefrontStore,
      url: URL_,
    });
    expect((node.offers as Record<string, unknown>).priceCurrency).toBe("BDT");
  });
});

describe("storeJsonLd", () => {
  it("omits contact/social keys the merchant has not filled in", () => {
    const node = storeJsonLd({ store, url: "https://shop.example.com" });
    expect(node.name).toBe("Rashid's Mart");
    expect(node.sameAs).toBeUndefined();
    expect(node.address).toBeUndefined();
    expect(node.telephone).toBeUndefined();
  });

  it("emits sameAs + address once they exist, dropping non-URL socials", () => {
    const node = storeJsonLd({
      store: {
        ...store,
        contact: { phone: "+8801700000000", address: "12 Road, Dhaka" },
        social: {
          facebook: "https://facebook.com/rmc41",
          instagram: "not-a-url",
        },
      } as StorefrontStore,
      url: "https://shop.example.com",
    });
    expect(node.sameAs).toEqual(["https://facebook.com/rmc41"]);
    expect(node.address).toMatchObject({ streetAddress: "12 Road, Dhaka" });
    expect(node.telephone).toBe("+8801700000000");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from 1 in trail order", () => {
    const node = breadcrumbJsonLd([
      { name: "Home", url: "https://s.com/" },
      { name: "Products", url: "https://s.com/products" },
      { name: "Drill Bit Set", url: URL_ },
    ]);
    const items = node.itemListElement as Record<string, unknown>[];
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[2]).toMatchObject({ name: "Drill Bit Set", item: URL_ });
  });
});
