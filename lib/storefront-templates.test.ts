import { describe, expect, it } from "vitest";
import {
  isImageRatio,
  mediaRatioFor,
  resolveHeaderMenu,
  resolveSections,
  resolveTemplates,
} from "@/lib/storefront-templates";

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

describe("resolveTemplates — cardActions", () => {
  const actions = (templates: Record<string, string>) =>
    resolveTemplates({ templates }).cardActions;

  it("maps every admin id to its storefront name", () => {
    expect(actions({ cardActions: "add" })).toBe("add");
    expect(actions({ cardActions: "add-buy" })).toBe("addBuy");
    expect(actions({ cardActions: "icons" })).toBe("icons");
    expect(actions({ cardActions: "buy-first" })).toBe("buyFirst");
    expect(actions({ cardActions: "reveal" })).toBe("reveal");
    expect(actions({ cardActions: "icon-only" })).toBe("iconOnly");
  });

  /*
   * The migration contract, and the reason `cardActions` is a separate key at
   * all. Before it existed, `productCard: "compact"` hard-coded its own CTA — a
   * single inline "+". An unset value on a compact store must therefore resolve
   * to `iconOnly`, or every compact shop silently grows two text buttons its
   * owner never chose.
   */
  it("keeps a legacy compact store on its inline icon when unset", () => {
    expect(actions({ productCard: "compact" })).toBe("iconOnly");
    expect(actions({ productCard: "compact", cardActions: "" })).toBe("iconOnly");
    expect(actions({ productCard: "compact", cardActions: "bogus" })).toBe(
      "iconOnly",
    );
  });

  it("defaults every other density to both buttons", () => {
    expect(actions({})).toBe("addBuy");
    expect(actions({ productCard: "standard" })).toBe("addBuy");
    expect(actions({ productCard: "bold" })).toBe("addBuy");
    expect(resolveTemplates(undefined).cardActions).toBe("addBuy");
  });

  // The axes are independent: an explicit choice must beat the density-derived
  // fallback, including on compact.
  it("lets an explicit choice override the compact fallback", () => {
    expect(actions({ productCard: "compact", cardActions: "add-buy" })).toBe(
      "addBuy",
    );
    expect(actions({ productCard: "bold", cardActions: "icon-only" })).toBe(
      "iconOnly",
    );
  });
});

describe("mediaRatioFor", () => {
  it("maps every option to its CSS aspect ratio", () => {
    expect(mediaRatioFor("square")).toBe("1 / 1");
    expect(mediaRatioFor("portrait")).toBe("3 / 4");
    expect(mediaRatioFor("landscape")).toBe("4 / 3");
    expect(mediaRatioFor("tall")).toBe("2 / 3");
  });

  // The default is the shape every store rendered before the setting existed,
  // so an unresolved value must land there rather than on a taller frame.
  it("falls back to square", () => {
    expect(mediaRatioFor(undefined as never)).toBe("1 / 1");
    expect(mediaRatioFor("bogus" as never)).toBe("1 / 1");
  });
});

describe("isImageRatio", () => {
  it("accepts the catalogue and rejects everything else", () => {
    expect(isImageRatio("portrait")).toBe(true);
    expect(isImageRatio("square")).toBe(true);
    expect(isImageRatio("bogus")).toBe(false);
    expect(isImageRatio(null)).toBe(false);
    expect(isImageRatio(undefined)).toBe(false);
    // `in` on a plain object would say true for these — the guard must not.
    expect(isImageRatio("toString")).toBe(false);
    expect(isImageRatio("constructor")).toBe(false);
  });
});

describe("resolveTemplates — imageRatio", () => {
  it("defaults to square and ignores an unknown id", () => {
    expect(resolveTemplates(undefined).imageRatio).toBe("square");
    expect(resolveTemplates({ templates: {} }).imageRatio).toBe("square");
    expect(resolveTemplates({ templates: { imageRatio: "nope" } }).imageRatio).toBe("square");
  });

  it("honours a saved choice", () => {
    expect(resolveTemplates({ templates: { imageRatio: "tall" } }).imageRatio).toBe("tall");
  });
});

/* `accountLayout` selects a whole PAGE COMPONENT, not a variation within one, so
   an unresolved value is worse here than anywhere else: the account-area
   registry would look up `undefined` and the signed-in shopper would get a blank
   page instead of a slightly wrong one. The fallback is the guard. */
describe("resolveTemplates — accountLayout", () => {
  it("defaults to sidebar and ignores an unknown id", () => {
    expect(resolveTemplates(undefined).accountLayout).toBe("sidebar");
    expect(resolveTemplates({ templates: {} }).accountLayout).toBe("sidebar");
    expect(
      resolveTemplates({ templates: { accountLayout: "nope" } }).accountLayout,
    ).toBe("sidebar");
  });

  it("honours each layout the registry can render", () => {
    for (const id of ["sidebar", "tabs", "panel", "editorial"] as const) {
      expect(
        resolveTemplates({ templates: { accountLayout: id } }).accountLayout,
      ).toBe(id);
    }
  });
});

// The same prototype hole `isImageRatio` had, in the shared `pick()` every
// template key goes through: `map["constructor"]` is truthy and would return a
// FUNCTION as the variant name. Merchant-stored strings reach this.
describe("resolveTemplates — prototype keys are not variants", () => {
  for (const key of ["constructor", "toString", "hasOwnProperty", "__proto__"]) {
    it(`ignores ${key}`, () => {
      const t = resolveTemplates({
        templates: {
          home: key,
          productCard: key,
          imageFit: key,
          imageRatio: key,
          accountLayout: key,
        },
      });
      expect(t.home).toBe("classic");
      expect(t.productCard).toBe("standard");
      expect(t.imageFit).toBe("fit");
      expect(t.imageRatio).toBe("square");
      expect(t.accountLayout).toBe("sidebar");
    });
  }
});

describe("resolveSections", () => {
  const presets = {
    classic: ["hero-card", "featured-grid"],
    "hero-split": ["hero-split", "picks-grid"],
  };
  const isSectionId = (v: unknown) =>
    typeof v === "string" &&
    ["hero-card", "featured-grid", "hero-split", "picks-grid", "trust-band"].includes(v);
  const opts = { isSectionId, presets };
  const inst = (type: string, i: number) => ({ key: `${type}-${i}`, type });
  const preset = (name: keyof typeof presets) => presets[name].map(inst);

  it("falls back to the preset for the store's home template", () => {
    expect(resolveSections(undefined, opts)).toEqual(preset("classic"));
    expect(resolveSections({ templates: { home: "hero-split" } }, opts)).toEqual(
      preset("hero-split"),
    );
  });

  it("prefers the saved list over the preset, and the draft over both", () => {
    const store = { theme: { homepageSections: [{ key: "a", type: "trust-band" }] } };
    expect(resolveSections(store, opts)).toEqual([{ key: "a", type: "trust-band" }]);
    expect(
      resolveSections(store, { ...opts, draft: [{ key: "b", type: "featured-grid" }] }),
    ).toEqual([{ key: "b", type: "featured-grid" }]);
  });

  it("drops sections whose type the registry cannot render", () => {
    const store = {
      theme: {
        homepageSections: [
          { key: "a", type: "hero-card" },
          { key: "b", type: "bogus" },
          { key: "c", type: "featured-grid" },
        ],
      },
    };
    expect(resolveSections(store, opts)).toEqual([
      { key: "a", type: "hero-card" },
      { key: "c", type: "featured-grid" },
    ]);
  });

  // The case a flat id list could not express. Both survive with their own key,
  // which is what lets the dispatch tell them apart and what per-section config
  // will join on — collapse them and a merchant's two product rows become one.
  it("keeps two instances of the same type, each with its own key", () => {
    const store = {
      theme: {
        homepageSections: [
          { key: "r1", type: "featured-grid" },
          { key: "r2", type: "featured-grid" },
        ],
      },
    };
    expect(resolveSections(store, opts)).toEqual([
      { key: "r1", type: "featured-grid" },
      { key: "r2", type: "featured-grid" },
    ]);
  });

  // ⚠ The blank-homepage guard. Every seeded store carried four ids from the
  // pre-registry catalogue that no section answers to; filtering strictly would
  // have rendered those shops an empty page while stores with an unset value
  // worked perfectly — the worst possible shape for a bug to have.
  it("falls back to the preset when NOTHING survives the filter", () => {
    const legacy = {
      theme: {
        homepageSections: ["banner", "featured", "categories", "products"].map((type, i) =>
          inst(type, i),
        ),
      },
    };
    expect(resolveSections(legacy, opts)).toEqual(preset("classic"));
  });

  // The same guard, absorbing the PRE-INSTANCE shape: a document written before
  // sections carried identity holds bare strings, where `.type` is undefined.
  // It must render the template's page, not throw and not blank.
  it("falls back for a store still holding the old string[] shape", () => {
    const legacy = { theme: { homepageSections: ["hero-card", "featured-grid"] } };
    expect(resolveSections(legacy as never, opts)).toEqual(preset("classic"));
  });

  it("treats an empty saved list as unset rather than as a blank page", () => {
    expect(resolveSections({ theme: { homepageSections: [] } }, opts)).toEqual(
      preset("classic"),
    );
  });

  // Deterministic keys are load-bearing: config joins on them and
  // `isThemeModified` compares against a freshly minted list, so a random key
  // would detach config and report an untouched theme as edited.
  it("mints the same keys for the same preset every time", () => {
    expect(resolveSections(undefined, opts)).toEqual(resolveSections(undefined, opts));
  });
});
