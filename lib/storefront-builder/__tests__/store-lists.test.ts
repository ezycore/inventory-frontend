// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { CatalogCategory } from "@/lib/storefront-client";
import { pickByIds, sectionCategories } from "@/lib/storefront-builder/store-lists";

const categories = [
  { _id: "phones", name: "Phones", slug: "phones", children: [{ _id: "cases", name: "Cases", slug: "cases" }] },
  { _id: "audio", name: "Audio", slug: "audio" },
] as CatalogCategory[];

describe("pickByIds", () => {
  it("keeps the merchant's order and drops ids the list no longer has", () => {
    const items = [{ _id: "a" }, { _id: "b" }, { _id: "c" }];
    expect(pickByIds(items, ["c", "gone", "a"]).map((item) => item._id)).toEqual(["c", "a"]);
    expect(pickByIds(items, [])).toEqual([]);
  });
});

describe("sectionCategories", () => {
  it("lists every top-level collection when none are picked", () => {
    expect(sectionCategories(categories, undefined).map((c) => c._id)).toEqual(["phones", "audio"]);
    expect(sectionCategories(categories, []).map((c) => c._id)).toEqual(["phones", "audio"]);
  });

  it("resolves picks at either level, in pick order, skipping missing ones", () => {
    expect(sectionCategories(categories, ["audio", "gone", "cases"]).map((c) => c._id)).toEqual([
      "audio",
      "cases",
    ]);
  });
});
