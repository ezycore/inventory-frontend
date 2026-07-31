import { describe, expect, it } from "vitest";
import { resolveHeaderMenu, resolveTemplates } from "@/lib/storefront-templates";

describe("resolveHeaderMenu", () => {
  it("honours an explicit source", () => {
    expect(resolveHeaderMenu({ headerMenu: "custom" }, false)).toBe("custom");
    expect(resolveHeaderMenu({ headerMenu: "collections" }, true)).toBe(
      "collections",
    );
  });

  // The migration contract: stores predate the switch, so an unset value must
  // reproduce the old implicit behaviour rather than defaulting to collections.
  it("keeps a legacy store's custom menu when the source is unset", () => {
    expect(resolveHeaderMenu(undefined, true)).toBe("custom");
    expect(resolveHeaderMenu({}, true)).toBe("custom");
  });

  it("falls back to collections when unset and no menu was built", () => {
    expect(resolveHeaderMenu(undefined, false)).toBe("collections");
    expect(resolveHeaderMenu({}, false)).toBe("collections");
  });

  it("ignores an unknown source and falls back", () => {
    expect(resolveHeaderMenu({ headerMenu: "bogus" }, true)).toBe("custom");
    expect(resolveHeaderMenu({ headerMenu: "" }, false)).toBe("collections");
  });

  // An explicit "collections" must survive a non-empty saved menu — that pair is
  // exactly what the old length-based fallback got wrong.
  it("lets an explicit collections choice beat a saved custom menu", () => {
    expect(resolveHeaderMenu({ headerMenu: "collections" }, true)).toBe(
      "collections",
    );
  });
});

describe("resolveTemplates", () => {
  it("maps admin ids to storefront variants", () => {
    expect(
      resolveTemplates({ templates: { home: "hero-split", collection: "grid-3" } })
        .home,
    ).toBe("hero-split");
    expect(
      resolveTemplates({ templates: { collection: "grid-3" } }).collection,
    ).toBe("grid3");
  });

  it("falls back to defaults for unset or unknown ids", () => {
    expect(resolveTemplates(undefined).home).toBe("classic");
    expect(resolveTemplates({ templates: { home: "nope" } }).home).toBe("classic");
    expect(resolveTemplates({ templates: {} }).hero).toBe("slides");
  });

  // The admin id is kebab-case ("load-more"); the storefront consumes a camel
  // variant name. Getting that bridge wrong silently lands on the default, which
  // for this surface means numbered pages — i.e. the setting looks ignored.
  it("maps the listing pagination modes", () => {
    expect(resolveTemplates({ templates: { pagination: "infinite" } }).pagination).toBe(
      "infinite",
    );
    expect(resolveTemplates({ templates: { pagination: "load-more" } }).pagination).toBe(
      "loadMore",
    );
    expect(resolveTemplates({ templates: { pagination: "pages" } }).pagination).toBe(
      "pages",
    );
  });

  // Every store predates this control, so unset must keep rendering what it
  // rendered yesterday.
  it("defaults pagination to numbered pages", () => {
    expect(resolveTemplates({ templates: {} }).pagination).toBe("pages");
    expect(resolveTemplates({ templates: { pagination: "bogus" } }).pagination).toBe(
      "pages",
    );
  });
});
