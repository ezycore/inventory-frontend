// coding-standard: maintained

import { describe, expect, it } from "vitest";
import {
  orderByIds,
  sectionQuery,
  sectionSignature,
} from "@/lib/storefront-sections";
import type { StoreSectionConfig } from "@/lib/storefront-client";

const manual = (productIds: string[], extra: Partial<StoreSectionConfig> = {}) =>
  ({ key: "k", source: "manual", productIds, ...extra }) as StoreSectionConfig;

describe("a hand-picked row asks for exactly its picks", () => {
  it("sends the ids and a limit equal to the pick count", () => {
    expect(sectionQuery(manual(["a", "b", "c"]), [])).toEqual({
      ids: "a,b,c",
      limit: 3,
      inStock: "1",
    });
  });

  it("does not clamp the count to the 4-12 range the other sources use", () => {
    /* `clampLimit` floors at 4. Applying it here would hand a merchant who
       picked three products a row asking for four — one they never chose. */
    expect(sectionQuery(manual(["a"]), [])).toMatchObject({ limit: 1 });
    const many = Array.from({ length: 20 }, (_, i) => `p${i}`);
    expect(sectionQuery(manual(many), [])).toMatchObject({ limit: 20 });
  });

  it("ignores a stray limit left behind by a previous source", () => {
    // Switching a row from "Featured, show 8" to hand-picked leaves `limit: 8`
    // on the config; the picks must still decide the length.
    expect(sectionQuery(manual(["a", "b"], { limit: 8 }), [])).toMatchObject({
      limit: 2,
    });
  });

  it("asks for nothing when the merchant has picked nothing", () => {
    // `null` ⇒ the page does not fetch and the row does not render. Sending a
    // query with no id filter would print the whole catalogue under the row.
    expect(sectionQuery(manual([]), [])).toBeNull();
    expect(sectionQuery({ key: "k", source: "manual" } as StoreSectionConfig, [])).toBeNull();
  });
});

describe("orderByIds restores the merchant's sequence", () => {
  const products = [{ _id: "c" }, { _id: "a" }, { _id: "b" }];

  it("puts the products back in the picked order", () => {
    // `$in` returns index order, not the order asked for — without this a
    // curated row is a curated SET and the lead product lands anywhere.
    expect(orderByIds(products, ["a", "b", "c"]).map((p) => p._id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps a product that is not in the list at the end", () => {
    expect(orderByIds(products, ["b"]).map((p) => p._id)).toEqual(["b", "c", "a"]);
  });

  it("is a no-op for a row that never picked anything", () => {
    expect(orderByIds(products, undefined)).toEqual(products);
    expect(orderByIds(products, [])).toEqual(products);
  });

  it("does not mutate its input", () => {
    const input = [{ _id: "c" }, { _id: "a" }];
    orderByIds(input, ["a", "c"]);
    expect(input.map((p) => p._id)).toEqual(["c", "a"]);
  });
});

describe("sectionSignature", () => {
  it("changes when the picks change", () => {
    // The preview matches draft rows to server-rendered ones on this. Without
    // the picks in it, re-picking would redraw the OLD products.
    expect(sectionSignature(manual(["a", "b"]))).not.toBe(
      sectionSignature(manual(["a", "c"])),
    );
    expect(sectionSignature(manual(["a", "b"]))).not.toBe(
      sectionSignature(manual(["b", "a"])),
    );
  });

  it("does not change when only the button or heading changes", () => {
    // Re-labelling must not throw away products the server already fetched.
    const base = manual(["a", "b"]);
    expect(sectionSignature({ ...base, ctaLabel: "See all" })).toBe(
      sectionSignature(base),
    );
    expect(sectionSignature({ ...base, ctaHref: "/x" })).toBe(sectionSignature(base));
    expect(sectionSignature({ ...base, showCta: false })).toBe(sectionSignature(base));
    expect(sectionSignature({ ...base, title: "Renamed" })).toBe(sectionSignature(base));
  });
});
