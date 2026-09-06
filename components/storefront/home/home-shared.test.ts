// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  gridProducts,
  sectionRow,
  trimToWholeRows,
} from "@/components/storefront/home/home-shared";

describe("trimToWholeRows — QA-124 (featured grid must not leave a ragged last row)", () => {
  it("drops the orphans: 6 items in a 4-wide grid becomes one full row of 4", () => {
    expect(trimToWholeRows([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4]);
  });

  it("leaves an already-whole count untouched", () => {
    expect(trimToWholeRows([1, 2, 3, 4, 5, 6, 7, 8])).toHaveLength(8);
  });

  it("leaves a small catalogue's single short row alone — that's not the ragged shape", () => {
    expect(trimToWholeRows([1, 2, 3])).toEqual([1, 2, 3]);
    expect(trimToWholeRows([])).toEqual([]);
  });

  it("9 items (2 full rows + 1 orphan) drops to 8", () => {
    expect(trimToWholeRows([1, 2, 3, 4, 5, 6, 7, 8, 9])).toHaveLength(8);
  });
});

describe("gridProducts — a hand-picked row is never trimmed", () => {
  const row = (n: number, isManual: boolean) => ({
    products: Array.from({ length: n }, (_, i) => ({ _id: String(i) })) as never,
    isManual,
  });

  /* The counts that were actually being lost. Five, six and seven picks all
     rendered four before this; nine rendered eight. The merchant was never told,
     and every other half of the feature promises the opposite — `sectionQuery`
     asks for exactly `ids.length`, the editor hides the "Show N" input, and the
     validator caps the list at 24 because the list IS the length. */
  it.each([5, 6, 7, 9, 23])("renders all %i picks", (n) => {
    expect(gridProducts(row(n, true))).toHaveLength(n);
  });

  it("still trims a catalogue-wide row — the ragged-row guard is unchanged", () => {
    expect(gridProducts(row(6, false))).toHaveLength(4);
    expect(gridProducts(row(9, false))).toHaveLength(8);
  });

  /* The worst version of the bug: picks that sold out shrink the row, and the
     trim then took it below what came back. Eight picked, two gone, six
     returned — six must render, not four. */
  it("keeps a curated row that shrank because picks sold out", () => {
    expect(gridProducts(row(6, true))).toHaveLength(6);
  });
});

describe("sectionRow — stale picks must not reorder a non-manual row", () => {
  const p = (id: string) => ({ _id: id }) as never;
  const props = (config: object) =>
    ({
      base: "/shop",
      categories: [],
      items: [p("a"), p("b"), p("c")],
      t: { viewAll: "View all", featured: "Featured", newArrivals: "New arrivals" },
      config,
    }) as never;
  const ids = (r: { products: { _id: string }[] }) => r.products.map((x) => x._id);
  const fallback = { products: [], title: "Fallback" };

  it("orders a manual row by the merchant's picks", () => {
    const row = sectionRow(props({ key: "k", source: "manual", productIds: ["c", "a"] }), fallback);
    expect(ids(row)).toEqual(["c", "a", "b"]);
    expect(row.isManual).toBe(true);
  });

  /* The editor merges config patches, so switching a row off `manual` used to
     leave `productIds` on the document — invisible (the picker only renders for
     `manual`) and permanent (nothing clears it, and the validator only requires
     the list for `manual`, never rejects it elsewhere). The row then silently
     hoisted those products to the front of an unrelated Featured row. */
  it("ignores picks left behind on a row whose source moved on", () => {
    const row = sectionRow(props({ key: "k", source: "featured", productIds: ["c", "a"] }), fallback);
    expect(ids(row)).toEqual(["a", "b", "c"]);
    expect(row.isManual).toBe(false);
  });

  it("ignores them on a category row too", () => {
    const row = sectionRow(props({ key: "k", source: "category", categoryId: "x", productIds: ["c"] }), fallback);
    expect(ids(row)).toEqual(["a", "b", "c"]);
  });
});

describe("sectionRow — a config with no source is 'default for this section'", () => {
  const p = (id: string) => ({ _id: id }) as never;
  const fallback = { products: [p("own-1"), p("own-2")], title: "Featured" };
  /* Reachable, not theoretical: emptying a hand-picked row that also carries a
     heading or a button keeps those and drops `source` + `productIds`, which is
     what the editor's own select then reads back as "Default for this section".
     `items` is undefined because `sectionQuery` returns null for such a row, so
     the page never fetches for its key. */
  const emptied = {
    base: "/shop",
    categories: [],
    items: undefined,
    t: { viewAll: "View all", featured: "Featured", newArrivals: "New arrivals" },
    config: { key: "k", title: "Our winter edit" },
  } as never;

  it("draws the section's own products instead of an empty row", () => {
    // It rendered NOTHING before this: no query, no items, `items ?? []`, and
    // every grid hides itself on an empty list — so writing a heading and then
    // clearing the picks deleted the section from the homepage.
    const row = sectionRow(emptied, fallback);
    expect(row.products.map((x) => x._id)).toEqual(["own-1", "own-2"]);
  });

  it("keeps the heading the merchant wrote", () => {
    expect(sectionRow(emptied, fallback).title).toBe("Our winter edit");
  });

  it("is not a manual row", () => {
    expect(sectionRow(emptied, fallback).isManual).toBe(false);
  });
});
