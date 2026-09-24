import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTER_SETTINGS,
  filterSettingsOverrides,
  groupKind,
  orderFilterGroups,
  readOptionParams,
  resolveFilterSettings,
  toggleInList,
  visibleSorts,
} from "@/lib/storefront-filters";

const facets = {
  brands: [{ _id: "b1", name: "Acme", productCount: 2 }],
  tags: [
    { _id: "t1", name: "Eid", slug: "eid", productCount: 1 },
    { _id: "t2", name: "Linen", slug: "linen", group: "Fabric", productCount: 1 },
  ],
  options: [{ name: "Size", values: [{ value: "M", productCount: 1 }] }],
  anyOutOfStock: true,
};

const ids = (groups: { id: string }[]) => groups.map((g) => g.id);

describe("resolveFilterSettings", () => {
  it("unset reads as the defaults — bottom sheet, sticky bar, drawer on desktop", () => {
    expect(resolveFilterSettings(undefined)).toEqual(DEFAULT_FILTER_SETTINGS);
  });

  it("narrows unknown ids back to the default", () => {
    const s = resolveFilterSettings({
      mobile: { entry: "popup" },
      desktop: { placement: "floating" },
      priceMode: "slider",
      sort: { default: "random", hidden: ["newest", "bogus"] },
    });
    expect(s.mobile.entry).toBe("sheet");
    expect(s.desktop.placement).toBe("drawer");
    expect(s.priceMode).toBe("both");
    expect(s.sort).toEqual({ default: "featured", hidden: ["newest"] });
  });

  it("the legacy `sidebar` collection layout means a sidebar until a placement is chosen (D1)", () => {
    expect(resolveFilterSettings(undefined, "sidebar").desktop.placement).toBe("sidebar");
    expect(
      resolveFilterSettings({ desktop: { placement: "bar" } }, "sidebar").desktop.placement,
    ).toBe("bar");
  });

  it("drops empty price ranges and caps quick chips at six", () => {
    const s = resolveFilterSettings({
      pricePresets: [{}, { max: 500 }],
      mobile: { quickChips: ["a", "b", "c", "d", "e", "f", "g"] },
    });
    expect(s.pricePresets).toEqual([{ min: undefined, max: 500 }]);
    expect(s.mobile.quickChips).toHaveLength(6);
  });
});

describe("filterSettingsOverrides", () => {
  it("stores nothing for an untouched shop", () => {
    expect(filterSettingsOverrides(DEFAULT_FILTER_SETTINGS)).toBeUndefined();
  });

  it("stores only what differs, and round-trips through the resolver", () => {
    const changed = {
      ...DEFAULT_FILTER_SETTINGS,
      mobile: { ...DEFAULT_FILTER_SETTINGS.mobile, entry: "drawer" as const },
      sort: { default: "newest" as const, hidden: ["discount" as const] },
      groups: [{ id: "brand" }, { id: "tags", label: "Occasion" }],
    };
    const stored = filterSettingsOverrides(changed);
    expect(stored).toEqual({
      mobile: { entry: "drawer" },
      sort: { default: "newest", hidden: ["discount"] },
      groups: [{ id: "brand" }, { id: "tags", label: "Occasion" }],
    });
    expect(resolveFilterSettings(stored)).toEqual({
      ...changed,
      groups: [
        { id: "brand", label: undefined, hidden: undefined, open: undefined },
        { id: "tags", label: "Occasion", hidden: undefined, open: undefined },
      ],
    });
  });
});

describe("visibleSorts", () => {
  it("never hides the default sort", () => {
    const s = resolveFilterSettings({ sort: { default: "newest", hidden: ["newest", "discount"] } });
    expect(visibleSorts(s)).toEqual(["featured", "newest", "price_asc", "price_desc"]);
  });
});

describe("orderFilterGroups", () => {
  const base = {
    facets,
    settings: DEFAULT_FILTER_SETTINGS,
    hideCategory: false,
    inStockActive: false,
    active: new Set<string>(),
  };

  it("default order: category, options, brand, tags, tag groups, price, availability", () => {
    const groups = orderFilterGroups(base);
    expect(ids(groups)).toEqual([
      "category",
      "option:Size",
      "brand",
      "tags",
      "tagGroup:Fabric",
      "price",
      "availability",
    ]);
    // Nothing active and nothing pre-opened: the first opens.
    expect(groups.map((g) => g.open)).toEqual([true, false, false, false, false, false, false]);
  });

  it("follows the merchant's order, renames and hides — but never hides an active group", () => {
    const settings = resolveFilterSettings({
      groups: [
        { id: "price", label: "Budget" },
        { id: "brand", hidden: true },
        { id: "tags", hidden: true },
      ],
    });
    const groups = orderFilterGroups({ ...base, settings, active: new Set(["tags"]) });
    expect(ids(groups)).toEqual([
      "price",
      "tags",
      "category",
      "option:Size",
      "tagGroup:Fabric",
      "availability",
    ]);
    expect(groups[0].label).toBe("Budget");
    expect(groups.find((g) => g.id === "tags")?.open).toBe(true);
  });

  it("offers Availability only when it would narrow something, or is on (F6)", () => {
    const quiet = { ...facets, anyOutOfStock: false };
    expect(ids(orderFilterGroups({ ...base, facets: quiet }))).not.toContain("availability");
    expect(
      ids(orderFilterGroups({ ...base, facets: quiet, inStockActive: true })),
    ).toContain("availability");
  });

  it("drops groups with nothing to offer, and the category group on a category page", () => {
    const empty = { brands: [], tags: [], options: [], anyOutOfStock: false };
    expect(ids(orderFilterGroups({ ...base, facets: empty, hideCategory: true }))).toEqual(["price"]);
  });
});

describe("URL helpers", () => {
  it("reads opt.* params as lists", () => {
    const sp = new URLSearchParams("opt.Size=M,L&brandId=x&opt.Colour=Red");
    expect(readOptionParams(sp)).toEqual({ Size: ["M", "L"], Colour: ["Red"] });
  });

  it("toggles a value in a comma list, deleting the param when it empties", () => {
    expect(toggleInList(["a"], "b")).toBe("a,b");
    expect(toggleInList(["a", "b"], "a")).toBe("b");
    expect(toggleInList(["a"], "a")).toBeUndefined();
  });

  it("knows each group id's kind", () => {
    expect(groupKind("option:Size")).toBe("option");
    expect(groupKind("tagGroup:Fabric")).toBe("tagGroup");
    expect(groupKind("price")).toBe("price");
    expect(groupKind("nonsense")).toBeUndefined();
  });
});
