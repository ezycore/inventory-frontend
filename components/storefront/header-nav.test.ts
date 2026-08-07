import { describe, expect, it } from "vitest";
import { expandHeaderMenu } from "@/components/storefront/header-nav";
import type { CatalogCategory, StoreMenuItem } from "@/lib/storefront-client";

/**
 * A collection is linked by its PATH (`/phones`, `/phones/accessories`) — its
 * canonical URL — not by the `?categoryId=` facet it used to be. A node with no
 * `slugPath` cannot route at all, so it is dropped rather than emitted as a dead
 * link; that is what the "slugless legacy category" fixture below covers.
 */
const cats = [
  {
    _id: "id1",
    name: "Led",
    slug: "led",
    slugPath: "led",
    children: [
      {
        _id: "id1a",
        name: "Strips",
        slug: "strips",
        slugPath: "led/strips",
      },
    ],
  },
  { _id: "id2", name: "Hand Tools" }, // slugless legacy category — unroutable
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
    // "Hand Tools" is absent: no slugPath, so there is no URL to link it to.
    expect(expandHeaderMenu(menu, cats).map((m) => m.label)).toEqual([
      "Deals",
      "Led",
      "About",
    ]);
  });

  it("links an expanded item by its path", () => {
    const [led] = expandHeaderMenu(
      [{ label: "All collections", type: "collections", value: "" }],
      cats,
    );
    expect(led).toMatchObject({ label: "Led", type: "url", value: "/led" });
  });

  it("nests sub-categories as dropdown children", () => {
    const [led] = expandHeaderMenu(
      [{ label: "All collections", type: "collections", value: "" }],
      cats,
    );
    expect(led.children).toEqual([
      { label: "Strips", type: "url", value: "/led/strips" },
    ]);
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
