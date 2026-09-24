import { describe, expect, it } from "vitest";
import { stripParent, subcategoriesFor } from "@/components/storefront/subcategory-strip";
import type {
  CatalogCategory,
  CatalogCategoryDetail,
} from "@/lib/storefront-client";

const led: CatalogCategory = {
  _id: "led",
  name: "Led",
  slug: "led",
  slugPath: "lights/led",
};
const lcd: CatalogCategory = {
  _id: "lcd",
  name: "LCD",
  slug: "lcd",
  slugPath: "lights/lcd",
};

const tree: CatalogCategory[] = [
  {
    _id: "lights",
    name: "Lights",
    slug: "lights",
    slugPath: "lights",
    children: [led, lcd],
  },
  { _id: "tools", name: "Hand Tools", slug: "hand-tools", slugPath: "hand-tools" },
];

const detail = (over: Partial<CatalogCategoryDetail>): CatalogCategoryDetail =>
  ({
    _id: "lights",
    name: "Lights",
    slug: "lights",
    slugPath: "lights",
    isSubcategory: false,
    ...over,
  }) as CatalogCategoryDetail;

describe("subcategoriesFor", () => {
  it("gives a parent collection its own children", () => {
    expect(subcategoriesFor(detail({}), tree).map((c) => c._id)).toEqual([
      "led",
      "lcd",
    ]);
  });

  it("gives a child collection its siblings, so drilling in is not a dead end", () => {
    const child = detail({
      _id: "led",
      name: "Led",
      slugPath: "lights/led",
      isSubcategory: true,
      parent: { _id: "lights", name: "Lights", slugPath: "lights" },
    });
    expect(subcategoriesFor(child, tree).map((c) => c._id)).toEqual([
      "led",
      "lcd",
    ]);
  });

  it("returns nothing for a collection with no children", () => {
    const tools = detail({ _id: "tools", name: "Hand Tools", slugPath: "hand-tools" });
    expect(subcategoriesFor(tools, tree)).toEqual([]);
  });

  it("returns nothing off a collection page", () => {
    // The bare `/products` listing has no collection at all.
    expect(subcategoriesFor(undefined, tree)).toEqual([]);
  });

  it("returns nothing when the collection is absent from the tree", () => {
    // Unlisted or inactive — it never reaches the public payload.
    expect(subcategoriesFor(detail({ _id: "ghost" }), tree)).toEqual([]);
  });
});

describe("stripParent", () => {
  it("is the collection itself on a parent page and its parent on a child page (P6)", () => {
    expect(stripParent(detail({}))?._id).toBe("lights");
    const child = detail({
      _id: "led",
      isSubcategory: true,
      parent: { _id: "lights", name: "Lights", slugPath: "lights" },
    });
    expect(stripParent(child)).toEqual({ _id: "lights", name: "Lights", slugPath: "lights" });
    expect(stripParent(undefined)).toBeUndefined();
  });
});
