import { describe, expect, it } from "vitest";
import { expandHeaderMenu } from "@/components/storefront/header-nav";
import type { CatalogCategory, StoreMenuItem } from "@/lib/storefront-client";

const cats = [
  { _id: "id1", name: "Led", slug: "led" },
  { _id: "id2", name: "Hand Tools" }, // slugless legacy category
] as CatalogCategory[];

const link = (label: string): StoreMenuItem => ({ label, type: "url", value: "/x" });

describe("expandHeaderMenu", () => {
  it("returns the menu untouched when there is no collections block", () => {
    const menu = [link("Deals")];
    expect(expandHeaderMenu(menu, cats)).toBe(menu);
  });

  it("expands the block in place, keeping surrounding links", () => {
    const menu: StoreMenuItem[] = [
      link("Deals"),
      { label: "All collections", type: "collections", value: "" },
      link("About"),
    ];
    expect(expandHeaderMenu(menu, cats).map((m) => m.label)).toEqual([
      "Deals",
      "Led",
      "Hand Tools",
      "About",
    ]);
  });

  // Id-based URLs mirror collections mode — slugless categories still filter.
  it("links expanded items by category id", () => {
    const [led] = expandHeaderMenu(
      [{ label: "All collections", type: "collections", value: "" }],
      cats,
    );
    expect(led).toEqual({
      label: "Led",
      type: "url",
      value: "/products?categoryId=id1",
    });
  });

  it("expands to nothing when no collections are listed", () => {
    expect(
      expandHeaderMenu(
        [{ label: "All collections", type: "collections", value: "" }, link("About")],
        [],
      ).map((m) => m.label),
    ).toEqual(["About"]);
  });
});
