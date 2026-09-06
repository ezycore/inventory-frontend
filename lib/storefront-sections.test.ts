/**
 * Per-section homepage config — the query, the signature and the heading.
 *
 * These three have to agree between the server render and the Customize
 * preview, which reach the catalogue through different transports. A drift
 * between them does not throw: it shows the shopper one set of products and the
 * merchant another, which is the hardest kind of bug to be told about.
 */
import { describe, expect, it } from "vitest";

import {
  configFor,
  configuredSections,
  findSectionCategory,
  isConfigurableSection,
  resolveCardShape,
  sectionConfigKind,
  sectionQuery,
  sectionSignature,
  sectionTitle,
} from "@/lib/storefront-sections";
import type { CatalogCategory, StoreSectionConfig } from "@/lib/storefront-client";

const categories = [
  {
    _id: "top1",
    name: "Skin care",
    slug: "skin-care",
    children: [{ _id: "kid1", name: "Serums", slug: "serums" }],
  },
  { _id: "top2", name: "Devices", slug: "devices" },
] as unknown as CatalogCategory[];

const t = { featured: "Featured", newArrivals: "New arrivals" } as never;

describe("sectionQuery", () => {
  it("asks for in-stock products on every source", () => {
    // The homepage is a shop window: a card nobody can buy is dead space in the
    // few slots that decide whether a visitor goes any further.
    for (const source of ["featured", "newest", "category"] as const) {
      const q = sectionQuery(
        { key: "k", source, categoryId: source === "category" ? "top1" : undefined },
        categories,
      );
      expect(q?.inStock).toBe("1");
    }
  });

  it("sorts a `newest` row explicitly", () => {
    // REQUIRED, not tidiness. The catalogue's default sort is featured-first,
    // which made this row open with the same products, in the same order, as
    // the Featured row above it.
    expect(sectionQuery({ key: "k", source: "newest" }, categories)?.sort).toBe("newest");
  });

  it("leaves a `category` row unsorted, taking the featured-first default", () => {
    // The merchant's own picks are exactly what should lead a collection's row.
    expect(
      sectionQuery({ key: "k", source: "category", categoryId: "top1" }, categories),
    ).not.toHaveProperty("sort");
  });

  it("filters a SUB-collection on subcategoryId, not categoryId", () => {
    // Products are denormalized: `categoryId` is the top-level id and
    // `subcategoryId` its child. Sending a child's id as `categoryId` matches
    // nothing and renders an empty row.
    expect(sectionQuery({ key: "k", source: "category", categoryId: "kid1" }, categories)).toMatchObject(
      { subcategoryId: "kid1" },
    );
    expect(sectionQuery({ key: "k", source: "category", categoryId: "top1" }, categories)).toMatchObject(
      { categoryId: "top1" },
    );
  });

  it("returns null for a collection that no longer exists", () => {
    // Not an empty query: asking with no filter would return the whole
    // catalogue under a heading naming a collection the merchant deleted.
    expect(sectionQuery({ key: "k", source: "category", categoryId: "gone" }, categories)).toBeNull();
    expect(sectionQuery({ key: "k", source: "category" }, categories)).toBeNull();
  });

  it("clamps the product count to the range the editor offers", () => {
    expect(sectionQuery({ key: "k", source: "featured", limit: 99 }, categories)?.limit).toBe(12);
    expect(sectionQuery({ key: "k", source: "featured", limit: 1 }, categories)?.limit).toBe(4);
    expect(sectionQuery({ key: "k", source: "featured" }, categories)?.limit).toBe(8);
  });
});

describe("sectionSignature", () => {
  it("changes when the products change", () => {
    const a: StoreSectionConfig = { key: "k", source: "category", categoryId: "top1" };
    expect(sectionSignature(a)).not.toBe(sectionSignature({ ...a, categoryId: "top2" }));
    expect(sectionSignature(a)).not.toBe(sectionSignature({ ...a, source: "featured" }));
    expect(sectionSignature(a)).not.toBe(sectionSignature({ ...a, limit: 4 }));
  });

  it("does NOT change when only the heading changes", () => {
    // The preview matches draft rows to server-rendered ones on this. Renaming
    // a row must not throw away products the server already fetched.
    const a: StoreSectionConfig = { key: "k", source: "featured" };
    expect(sectionSignature(a)).toBe(sectionSignature({ ...a, title: "Eid picks" }));
  });

  it("is the same for two sections asking the same thing", () => {
    // What lets the page fetch once for both instead of twice.
    expect(sectionSignature({ key: "r1", source: "newest", limit: 6 })).toBe(
      sectionSignature({ key: "r2", source: "newest", limit: 6 }),
    );
  });
});

describe("sectionTitle", () => {
  it("prefers the merchant's own words", () => {
    expect(sectionTitle({ key: "k", source: "featured", title: " Eid picks " }, t, categories, "x")).toBe(
      "Eid picks",
    );
  });

  it("falls back to wording that follows the SHOPPER's language", () => {
    // A typed title is one string and cannot be translated, which is why blank
    // is the better default rather than pre-filling every row.
    expect(sectionTitle({ key: "k", source: "featured" }, t, categories, "x")).toBe("Featured");
    expect(sectionTitle({ key: "k", source: "newest" }, t, categories, "x")).toBe("New arrivals");
  });

  it("uses the collection's own name for a category row", () => {
    expect(
      sectionTitle({ key: "k", source: "category", categoryId: "kid1" }, t, categories, "x"),
    ).toBe("Serums");
  });

  it("falls back to the section's own heading when the collection is gone", () => {
    expect(
      sectionTitle({ key: "k", source: "category", categoryId: "gone" }, t, categories, "Selected"),
    ).toBe("Selected");
  });
});

describe("configuredSections", () => {
  const sections = [
    { key: "hero", type: "hero-card" },
    { key: "r1", type: "featured-grid" },
    { key: "r2", type: "featured-grid" },
    { key: "r3", type: "product-rail" },
  ];

  it("returns one entry per CONFIGURED product section, ignoring the rest", () => {
    const store = {
      sectionConfig: [
        { key: "hero", source: "featured" as const },
        { key: "r1", source: "category" as const, categoryId: "top1" },
        { key: "r2", source: "newest" as const },
      ],
    };
    const out = configuredSections(sections, store.sectionConfig, categories);
    // `hero` is not a product section, and `r3` has no config — both skipped.
    expect(out.map((r) => r.key)).toEqual(["r1", "r2"]);
  });

  it("drops a section whose collection has been deleted", () => {
    const store = {
      sectionConfig: [{ key: "r1", source: "category" as const, categoryId: "gone" }],
    };
    expect(configuredSections(sections, store.sectionConfig, categories)).toEqual([]);
  });

  it("returns nothing when the store has no config at all", () => {
    // The untouched store: every section renders its built-in source and the
    // page makes no extra queries.
    expect(configuredSections(sections, undefined, categories)).toEqual([]);
  });
});

describe("configFor / findSectionCategory / isConfigurableSection", () => {
  it("ignores an ORPHAN config entry rather than erroring", () => {
    // The backend keeps orphans on purpose: a PATCH may carry one array without
    // the other, and pruning would delete the config of a section the merchant
    // is halfway through re-adding.
    expect(configFor([{ key: "gone", source: "featured" }], "r1")).toBeUndefined();
  });

  it("finds a collection at either level and says which", () => {
    expect(findSectionCategory(categories, "top1")?.isSubcategory).toBe(false);
    expect(findSectionCategory(categories, "kid1")?.isSubcategory).toBe(true);
    expect(findSectionCategory(categories, "nope")).toBeNull();
    expect(findSectionCategory(categories, undefined)).toBeNull();
  });

  it("marks only product sections configurable", () => {
    expect(isConfigurableSection("featured-grid")).toBe(true);
    expect(isConfigurableSection("product-rail")).toBe(true);
    // A hero has no products to source, so config would be an empty control.
    expect(isConfigurableSection("hero-card")).toBe(false);
    expect(isConfigurableSection("trust-band")).toBe(false);
  });
});

/**
 * The three config kinds, and the two questions they answer.
 *
 * These were two overlapping sets — `CONFIGURABLE` and `TAG_CONFIGURABLE` —
 * answering "which editor does this section get?" and "does this row earn a
 * catalogue fetch?" at the same time, and agreeing only by accident. A third
 * section with a third control is where that would have broken: it would have
 * been silently treated as a product row by whichever caller reached it first.
 */
describe("sectionConfigKind", () => {
  it("names the control a configurable section gets", () => {
    expect(sectionConfigKind("featured-grid")).toBe("products");
    expect(sectionConfigKind("product-rail")).toBe("products");
    expect(sectionConfigKind("minimal-picks")).toBe("products");
    expect(sectionConfigKind("tag-chips")).toBe("tags");
    expect(sectionConfigKind("category-banners")).toBe("categories");
  });

  it("says nothing about a section that ignores config", () => {
    expect(sectionConfigKind("hero-card")).toBeUndefined();
    expect(sectionConfigKind("trust-band")).toBeUndefined();
    expect(sectionConfigKind("category-tiles")).toBeUndefined();
  });

  // Only a product row does. A tag or promo-card row renders from data the
  // homepage already loaded, so listing one here would cost every shop that
  // composes it a round trip for products it never shows.
  it("earns a catalogue fetch for product rows only", () => {
    expect(isConfigurableSection("featured-grid")).toBe(true);
    expect(isConfigurableSection("tag-chips")).toBe(false);
    expect(isConfigurableSection("category-banners")).toBe(false);
  });
});

/**
 * The promo card's composition, and specifically what "not chosen" means.
 *
 * The storefront and the editor both read this, and the whole reason it is a
 * function rather than an `=== "split"` at each end is that they must not
 * disagree about the fallback — the editor's selected pill and the rendered
 * card are one answer shown twice.
 */
describe("resolveCardShape", () => {
  it("falls back to the card every row drew before the choice existed", () => {
    expect(resolveCardShape(undefined)).toBe("stacked");
    expect(resolveCardShape(null)).toBe("stacked");
    expect(resolveCardShape({})).toBe("stacked");
  });

  it("moves the picture only on an explicit split", () => {
    expect(resolveCardShape({ cardShape: "split" })).toBe("split");
    expect(resolveCardShape({ cardShape: "stacked" })).toBe("stacked");
  });

  // A value from an older payload, a hand-written API call, or a field that
  // survived a rename. Anything unrecognised is a shop that has not chosen, and
  // must land on the default rather than on an empty class name.
  it("treats an unrecognised value as not chosen", () => {
    expect(resolveCardShape({ cardShape: "beside" })).toBe("stacked");
    expect(resolveCardShape({ cardShape: null })).toBe("stacked");
  });
});
