import { describe, expect, it } from "vitest";
import type { CatalogCategory, StoreMenuItem } from "@/lib/storefront-client";
import {
  DEFAULT_MENU_SETTINGS,
  PHONE_OPEN_RULE,
  RAIL_OPEN_RULE,
  buildMenuTree,
  chipNodes,
  customMenuLacksCategories,
  findCategory,
  initialOpenKeys,
  isNodeActive,
  menuSettingsOverrides,
  phoneMenuTree,
  resolveMenuSettings,
  type MenuNode,
} from "@/lib/storefront-menu";

/**
 * A collection is linked by its PATH (`/led`, `/led/strips`) — its canonical
 * URL. A node with no `slugPath` cannot route at all, so it is dropped rather
 * than emitted as a dead link; that is what the slugless legacy fixture covers.
 *
 * "Accessories" appears under two parents on purpose: a leaf slug is only
 * unique within its parent, which is why the editor now stores paths.
 */
const cats = [
  {
    _id: "led",
    name: "Led",
    slug: "led",
    slugPath: "led",
    image: { thumbnailUrl: "https://cdn/led-t.webp" },
    children: [
      { _id: "strips", name: "Strips", slug: "strips", slugPath: "led/strips" },
      { _id: "led-acc", name: "Accessories", slug: "accessories", slugPath: "led/accessories" },
    ],
  },
  {
    _id: "phones",
    name: "Phones",
    slug: "phones",
    slugPath: "phones",
    children: [
      { _id: "ph-acc", name: "Accessories", slug: "accessories", slugPath: "phones/accessories" },
    ],
  },
  { _id: "tools", name: "Hand Tools", slug: "hand-tools" }, // slugless — unroutable
] as CatalogCategory[];

const link = (label: string, value = "/x"): StoreMenuItem => ({ label, type: "url", value });
const block: StoreMenuItem = { label: "All collections", type: "collections", value: "" };

const tree = (items: StoreMenuItem[], extra: Partial<Parameters<typeof buildMenuTree>[0]> = {}) =>
  buildMenuTree({ base: "", items, source: "custom", categories: cats, ...extra });

const labels = (nodes: MenuNode[]) => nodes.map((n) => n.label);

describe("buildMenuTree — sources", () => {
  it("draws the category tree for the collections source, ignoring the items", () => {
    const nodes = buildMenuTree({ base: "", items: [link("Deals")], source: "collections", categories: cats });
    expect(labels(nodes)).toEqual(["Led", "Phones"]);
    expect(nodes[0]).toMatchObject({ href: "/led", path: "led", image: "https://cdn/led-t.webp" });
    expect(labels(nodes[0].children)).toEqual(["Strips", "Accessories"]);
  });

  it("expands a collections block in place, keeping surrounding links", () => {
    expect(labels(tree([link("Deals"), block, link("About")]))).toEqual([
      "Deals",
      "Led",
      "Phones",
      "About",
    ]);
  });

  it("expands a block to nothing when no collections are listed", () => {
    expect(labels(tree([block, link("About")], { categories: [] }))).toEqual(["About"]);
  });

  it("prefixes the store base and keeps absolute links external", () => {
    const [shop, blog] = tree([link("Shop", "/products"), link("Blog", "https://example.com")], {
      base: "/s/acme",
    });
    expect(shop).toMatchObject({ href: "/s/acme/products", external: false, path: "products" });
    expect(blog).toMatchObject({ href: "https://example.com", external: true });
  });
});

describe("buildMenuTree — a category item's dropdown", () => {
  // A merchant who picks their top links one by one never gets a collections
  // block, and used to end up with a flat menu.
  it("inherits sub-categories when nothing is authored (the pre-existing rule)", () => {
    const [led] = tree([{ label: "Led", type: "category", value: "led" }]);
    expect(labels(led.children)).toEqual(["Strips", "Accessories"]);
    expect(led.children[0].href).toBe("/led/strips");
  });

  it("keeps an explicitly authored child list", () => {
    const [led] = tree([{ label: "Led", type: "category", value: "led", children: [link("Only this")] }]);
    expect(labels(led.children)).toEqual(["Only this"]);
  });

  it("honours childrenMode over the legacy rule", () => {
    const authored = [link("Picked")];
    const mode = (childrenMode: StoreMenuItem["childrenMode"]) =>
      labels(tree([{ label: "Led", type: "category", value: "led", children: authored, childrenMode }])[0].children);
    expect(mode("auto")).toEqual(["Strips", "Accessories"]);
    expect(mode("custom")).toEqual(["Picked"]);
    expect(mode("none")).toEqual([]);
  });

  it("an explicit custom mode with no children is no dropdown, not the inherited one", () => {
    const [led] = tree([{ label: "Led", type: "category", value: "led", childrenMode: "custom" }]);
    expect(led.children).toEqual([]);
  });

  it("'off' drops inherited sub-categories but keeps a hand-built dropdown", () => {
    const nodes = tree(
      [
        { label: "Led", type: "category", value: "led" },
        { label: "Deals", type: "url", value: "/deals", children: [link("Eid")] },
      ],
      { subcategories: "off" },
    );
    expect(nodes[0].children).toEqual([]);
    expect(labels(nodes[1].children)).toEqual(["Eid"]);
  });

  it("sends a category that no longer exists to the full listing", () => {
    const [gone] = tree([{ label: "Gone", type: "category", value: "nope" }]);
    expect(gone).toMatchObject({ href: "/products", children: [] });
  });
});

describe("findCategory", () => {
  it("resolves a full path to exactly that sub-category", () => {
    expect(findCategory(cats, "phones/accessories")?._id).toBe("ph-acc");
  });

  it("resolves a legacy leaf slug, parents first", () => {
    expect(findCategory(cats, "phones")?._id).toBe("phones");
    // The ambiguous one: the first parent's child wins, as it always did.
    expect(findCategory(cats, "accessories")?._id).toBe("led-acc");
  });

  it("never falls back to a leaf match for an unknown path", () => {
    expect(findCategory(cats, "garden/accessories")).toBeUndefined();
  });
});

describe("phoneMenuTree — decision B", () => {
  const args = { base: "", source: "custom" as const, categories: cats };

  it("follows a custom menu that names categories exactly", () => {
    const items = [{ label: "Led", type: "category" as const, value: "led" }, link("About")];
    expect(labels(phoneMenuTree({ ...args, items }))).toEqual(["Led", "About"]);
    expect(customMenuLacksCategories("custom", items)).toBe(false);
  });

  it("puts the category tree in front of a custom menu with no categories", () => {
    const items = [link("About"), link("Contact")];
    expect(labels(phoneMenuTree({ ...args, items }))).toEqual(["Led", "Phones", "About", "Contact"]);
    expect(customMenuLacksCategories("custom", items)).toBe(true);
  });

  it("does not duplicate anything for the collections source", () => {
    expect(labels(phoneMenuTree({ ...args, source: "collections", items: [] }))).toEqual(["Led", "Phones"]);
  });
});

describe("isNodeActive", () => {
  const [led, phones] = tree([block]);

  it("matches the node's own path and anything under it", () => {
    expect(isNodeActive(led, "/led")).toBe(true);
    expect(isNodeActive(led, "/led/strips")).toBe(true);
    expect(isNodeActive(led, "/s/acme/led?sort=newest")).toBe(true);
  });

  it("matches whole segments only", () => {
    // `/phones-cases` is not under `/phones` — the sidebar's old `includes()` said it was.
    expect(isNodeActive(phones, "/phones-cases")).toBe(false);
  });
});

describe("initialOpenKeys", () => {
  const nodes = tree([block]);
  const keys = (rule: Parameters<typeof initialOpenKeys>[1], path: string) =>
    [...initialOpenKeys(nodes, rule, path)];

  it("phone 'Current' opens the browsed department, else the first", () => {
    expect(keys(PHONE_OPEN_RULE.active, "/phones/accessories")).toEqual(["cat:phones"]);
    expect(keys(PHONE_OPEN_RULE.active, "/")).toEqual(["cat:led"]);
  });

  it("phone 'First' ignores where the shopper is", () => {
    expect(keys(PHONE_OPEN_RULE.first, "/phones")).toEqual(["cat:led"]);
  });

  it("sidebar 'Current' keeps its original rule — nothing open on the home page", () => {
    expect(keys(RAIL_OPEN_RULE.active, "/")).toEqual([]);
    expect(keys(RAIL_OPEN_RULE.first, "/")).toEqual(["cat:led"]);
  });

  it("'All' opens every group; 'None' and the flyout open none", () => {
    expect(keys("all", "/")).toEqual(["cat:led", "cat:phones"]);
    expect(keys(PHONE_OPEN_RULE.none, "/led")).toEqual([]);
    expect(keys(RAIL_OPEN_RULE.flyout, "/led")).toEqual([]);
  });
});

describe("chipNodes", () => {
  const nodes = tree([block]);
  it("lists parents, or parents each followed by their sub-categories", () => {
    expect(labels(chipNodes(nodes, "parents"))).toEqual(["Led", "Phones"]);
    expect(labels(chipNodes(nodes, "all"))).toEqual(["Led", "Strips", "Accessories", "Phones", "Accessories"]);
  });

  // The rule shared with the filter plan (§3.6): the collection page draws its
  // own sub-category strip, so the chips row must not repeat it.
  it("falls back to parents inside a department whose page draws the strip", () => {
    expect(labels(chipNodes(nodes, "all", "/shop/led/strips"))).toEqual(["Led", "Phones"]);
    expect(labels(chipNodes(nodes, "all", "/shop/led"))).toEqual(["Led", "Phones"]);
    expect(labels(chipNodes(nodes, "all", "/shop"))).toEqual([
      "Led",
      "Strips",
      "Accessories",
      "Phones",
      "Accessories",
    ]);
  });
});

describe("menu settings", () => {
  it("resolves an empty or unknown value to the defaults — accordion for every shop", () => {
    expect(resolveMenuSettings(undefined)).toEqual(DEFAULT_MENU_SETTINGS);
    expect(resolveMenuSettings({ mobile: { layout: "retired-id" } }).mobile.layout).toBe("accordion");
  });

  it("stores only what differs from the defaults", () => {
    expect(menuSettingsOverrides(DEFAULT_MENU_SETTINGS)).toBeUndefined();
    const changed = {
      ...DEFAULT_MENU_SETTINGS,
      mobile: { ...DEFAULT_MENU_SETTINGS.mobile, layout: "drill" as const },
      desktop: { ...DEFAULT_MENU_SETTINGS.desktop, row: true },
    };
    expect(menuSettingsOverrides(changed)).toEqual({ mobile: { layout: "drill" }, desktop: { row: true } });
  });

  it("round-trips: resolving the stored overrides gives the settings back", () => {
    const settings = resolveMenuSettings({ subcategories: "off", desktop: { dropdown: "mega", railOpen: "flyout" } });
    expect(resolveMenuSettings(menuSettingsOverrides(settings))).toEqual(settings);
  });

  it("trims the phone panel's text, stores blank as the localized default", () => {
    const settings = resolveMenuSettings({ mobile: { title: "  Browse  ", allProductsLabel: "x".repeat(60) } });
    expect(settings.mobile.title).toBe("Browse");
    // Never set ⇒ localized default; cleared ⇒ stored as "" and hides the heading.
    expect(resolveMenuSettings({}).mobile.title).toBeNull();
    expect(resolveMenuSettings({ mobile: { title: "" } }).mobile.title).toBe("");
    const cleared = { ...DEFAULT_MENU_SETTINGS, mobile: { ...DEFAULT_MENU_SETTINGS.mobile, title: "" } };
    expect(menuSettingsOverrides(cleared)).toEqual({ mobile: { title: "" } });
    expect(settings.mobile.allProductsLabel).toHaveLength(40);
    const typed = {
      ...DEFAULT_MENU_SETTINGS,
      mobile: { ...DEFAULT_MENU_SETTINGS.mobile, title: " Shop ", allProductsLabel: "   ", subImages: true, allProducts: false },
    };
    expect(menuSettingsOverrides(typed)).toEqual({ mobile: { title: "Shop", subImages: true, allProducts: false } });
  });
});

describe("collection page sub-category row setting", () => {
  it("defaults to the scroll row on both devices", () => {
    const s = resolveMenuSettings(undefined);
    expect(s.mobile.collectionStrip).toBe("scroll");
    expect(s.desktop.collectionStrip).toBe("scroll");
  });

  it("reads each device's answer and narrows unknown ids", () => {
    const s = resolveMenuSettings({
      mobile: { collectionStrip: "tiles" },
      desktop: { collectionStrip: "carousel" },
    });
    expect(s.mobile.collectionStrip).toBe("tiles");
    expect(s.desktop.collectionStrip).toBe("scroll");
  });

  it("stores only a device that moved off the default", () => {
    const s = resolveMenuSettings({ mobile: { collectionStrip: "wrap" } });
    expect(menuSettingsOverrides(s)).toEqual({ mobile: { collectionStrip: "wrap" } });
  });
});
