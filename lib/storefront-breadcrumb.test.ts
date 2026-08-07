import { describe, expect, it } from "vitest";
import {
  categoryCrumbs,
  collectionCrumbs,
  productCrumbs,
} from "@/lib/storefront-breadcrumb";
import type { CatalogCategory, CatalogCategoryDetail } from "@/lib/storefront-client";

const accessories: CatalogCategory = {
  _id: "sub1",
  name: "Accessories",
  slug: "accessories",
  slugPath: "phones/accessories",
};

const phones: CatalogCategory = {
  _id: "cat1",
  name: "Phones",
  slug: "phones",
  slugPath: "phones",
  children: [accessories],
};

const laptops: CatalogCategory = {
  _id: "cat2",
  name: "Laptops",
  slug: "laptops",
  slugPath: "laptops",
};

const tree = [phones, laptops];

describe("categoryCrumbs", () => {
  it("returns the parent alone when no sub-category is set", () => {
    expect(categoryCrumbs(tree, "cat1")).toEqual([
      { name: "Phones", path: "/phones" },
    ]);
  });

  it("returns both levels when the product carries a sub-category", () => {
    expect(categoryCrumbs(tree, "cat1", "sub1")).toEqual([
      { name: "Phones", path: "/phones" },
      { name: "Accessories", path: "/phones/accessories" },
    ]);
  });

  it("ignores a sub-category that is not a child of the given parent", () => {
    // Stale data, or a product whose category was re-pointed without clearing
    // its sub-category. One valid crumb beats two where the second is a lie.
    expect(categoryCrumbs(tree, "cat2", "sub1")).toEqual([
      { name: "Laptops", path: "/laptops" },
    ]);
  });

  it("returns nothing when the category is absent from the public tree", () => {
    // An unlisted or inactive category never reaches the storefront payload.
    expect(categoryCrumbs(tree, "missing")).toEqual([]);
  });

  it("returns nothing when the category cannot route", () => {
    // A row predating `slugPath`, before `backfill-slugs.ts` heals it — a crumb
    // here would link to a 404.
    const pathless = [{ _id: "cat9", name: "Legacy", slug: "legacy" }];
    expect(categoryCrumbs(pathless, "cat9")).toEqual([]);
  });

  it("drops an unroutable child but keeps its parent", () => {
    const halfHealed: CatalogCategory[] = [
      { ...phones, children: [{ _id: "sub9", name: "Cases", slug: "cases" }] },
    ];
    expect(categoryCrumbs(halfHealed, "cat1", "sub9")).toEqual([
      { name: "Phones", path: "/phones" },
    ]);
  });

  it("returns nothing for an uncategorized product", () => {
    expect(categoryCrumbs(tree, undefined)).toEqual([]);
    expect(categoryCrumbs(tree, "", null)).toEqual([]);
  });
});

describe("collectionCrumbs", () => {
  it("gives a top-level collection one crumb", () => {
    const c = {
      _id: "cat1",
      name: "Phones",
      slug: "phones",
      slugPath: "phones",
      isSubcategory: false,
    } as CatalogCategoryDetail;
    expect(collectionCrumbs(c)).toEqual([{ name: "Phones", path: "/phones" }]);
  });

  it("gives a sub-collection its parent then itself", () => {
    const c = {
      _id: "sub1",
      name: "Accessories",
      slug: "accessories",
      slugPath: "phones/accessories",
      isSubcategory: true,
      parent: { _id: "cat1", name: "Phones", slugPath: "phones" },
    } as CatalogCategoryDetail;
    expect(collectionCrumbs(c)).toEqual([
      { name: "Phones", path: "/phones" },
      { name: "Accessories", path: "/phones/accessories" },
    ]);
  });
});

describe("productCrumbs", () => {
  const base = {
    storeName: "Rashid's Mart",
    productName: "Fast Charger",
    productSlug: "fast-charger",
    categories: tree,
    allProductsLabel: "All products",
  };

  it("builds home → category → sub-category → product", () => {
    expect(
      productCrumbs({ ...base, categoryId: "cat1", subcategoryId: "sub1" }),
    ).toEqual([
      { name: "Rashid's Mart", path: "" },
      { name: "Phones", path: "/phones" },
      { name: "Accessories", path: "/phones/accessories" },
      { name: "Fast Charger", path: "/products/fast-charger" },
    ]);
  });

  it("falls back to the all-products rung when nothing links", () => {
    // Never collapses to home → product: the trail must always offer one link
    // upward, or a shopper landing from search has nowhere to go but back.
    expect(productCrumbs({ ...base, categoryId: undefined })).toEqual([
      { name: "Rashid's Mart", path: "" },
      { name: "All products", path: "/products" },
      { name: "Fast Charger", path: "/products/fast-charger" },
    ]);
  });
});
