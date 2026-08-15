import { describe, expect, it } from "vitest";
import type { CatalogCategory, StoreHomeRow } from "@/lib/storefront-client";
import {
  DEFAULT_HOME_ROWS,
  homeRowQuery,
  homeRowTitle,
  resolveHomeRows,
  rowSignature,
} from "@/lib/storefront-home-rows";
import { I18N } from "@/lib/storefront-i18n";

/**
 * The homepage's product rows. Every case here is one the storefront cannot
 * signal on its own — a wrong filter, a wrong fallback and a stale preview all
 * render a perfectly normal-looking row with the wrong products in it.
 */

const categories: CatalogCategory[] = [
  {
    _id: "care",
    name: "Personal Care",
    slug: "care",
    slugPath: "care",
    children: [{ _id: "skin", name: "Skin Care", slug: "skin", slugPath: "care/skin" }],
  },
  { _id: "devices", name: "Devices", slug: "devices", slugPath: "devices" },
];

const row = (over: Partial<StoreHomeRow>): StoreHomeRow => ({
  id: "r",
  source: "featured",
  ...over,
});

describe("resolveHomeRows", () => {
  it("falls back to the built-in pair when the merchant has never chosen", () => {
    expect(resolveHomeRows(undefined).map((r) => r.source)).toEqual([
      "featured",
      "newest",
    ]);
    expect(resolveHomeRows({}).map((r) => r.source)).toEqual(["featured", "newest"]);
  });

  it("treats an EMPTY list as a real answer, not as unset", () => {
    // A merchant who cleared every row must get a homepage with no product
    // rows; falling back here would resurrect rows they deliberately deleted.
    expect(resolveHomeRows({ homeRows: [] })).toEqual([]);
  });

  it("drops a category row that has no collection yet", () => {
    // Half-finished in the editor: the source is picked, the collection is not.
    const rows = resolveHomeRows({
      homeRows: [row({ source: "category" }), row({ id: "b", source: "newest" })],
    });
    expect(rows.map((r) => r.id)).toEqual(["b"]);
  });

  it("clamps the product count into the range the editor offers", () => {
    expect(resolveHomeRows({ homeRows: [row({ limit: 99 })] })[0].limit).toBe(12);
    expect(resolveHomeRows({ homeRows: [row({ limit: 1 })] })[0].limit).toBe(4);
    expect(resolveHomeRows({ homeRows: [row({})] })[0].limit).toBe(8);
  });

  it("caps the list at the backend's maximum", () => {
    const many = Array.from({ length: 9 }, (_, i) => row({ id: `r${i}` }));
    expect(resolveHomeRows({ homeRows: many })).toHaveLength(6);
  });
});

describe("homeRowQuery", () => {
  it("sorts a New arrivals row explicitly", () => {
    // The catalogue's default sort is featured-first, so without this the row
    // opens with the same products, in the same order, as a Featured row.
    expect(homeRowQuery(row({ source: "newest", limit: 8 }), categories)).toEqual({
      limit: 8,
      sort: "newest",
      inStock: "1",
    });
  });

  it("filters a TOP-LEVEL collection on categoryId", () => {
    expect(
      homeRowQuery(row({ source: "category", categoryId: "devices" }), categories),
    ).toEqual({ categoryId: "devices", limit: 8, inStock: "1" });
  });

  it("filters a SUB-collection on subcategoryId", () => {
    // Products denormalize `categoryId` to the TOP-LEVEL category, so sending a
    // child's id as `categoryId` matches nothing and renders an empty row.
    expect(
      homeRowQuery(row({ source: "category", categoryId: "skin" }), categories),
    ).toEqual({ subcategoryId: "skin", limit: 8, inStock: "1" });
  });

  it("returns null for a collection that no longer exists", () => {
    // Not an unfiltered query — that would show the whole catalogue under a
    // heading naming a collection the merchant deleted.
    expect(
      homeRowQuery(row({ source: "category", categoryId: "gone" }), categories),
    ).toBeNull();
  });

  it("keeps every row in stock", () => {
    for (const r of DEFAULT_HOME_ROWS) {
      expect(homeRowQuery(r, categories)).toMatchObject({ inStock: "1" });
    }
  });
});

describe("homeRowTitle", () => {
  const t = I18N.en;

  it("prefers the merchant's own heading", () => {
    expect(homeRowTitle(row({ title: "  Our picks  " }), t, categories)).toBe(
      "Our picks",
    );
  });

  it("falls back to wording that follows the shopper's language", () => {
    expect(homeRowTitle(row({ source: "newest" }), I18N.bn, categories)).toBe(
      I18N.bn.newArrivals,
    );
  });

  it("names the collection when a category row has no heading", () => {
    expect(
      homeRowTitle(row({ source: "category", categoryId: "skin" }), t, categories),
    ).toBe("Skin Care");
  });
});

describe("rowSignature", () => {
  it("ignores changes that cannot change the products", () => {
    // The preview reuses server-rendered products across a rename or a card-size
    // switch; re-fetching there would blank a row mid-edit for no reason.
    const base = row({ source: "category", categoryId: "skin", limit: 8 });
    expect(rowSignature({ ...base, title: "New name", layout: "compact" })).toBe(
      rowSignature(base),
    );
  });

  it("changes when the row is re-pointed", () => {
    // Same id, different products — matching on id alone would go on showing the
    // old row's products under the new heading.
    expect(rowSignature(row({ source: "featured" }))).not.toBe(
      rowSignature(row({ source: "category", categoryId: "skin" })),
    );
  });
});
