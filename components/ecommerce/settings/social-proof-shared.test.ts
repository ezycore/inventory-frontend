// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { filterSoldRows, soldCountsToSave } from "@/components/products/sold-counts/sold-counts-helpers";
import { NO_TAXONOMY_FILTER } from "@/components/products/catalog-filters/taxonomy-filter";
import { purchaseToastDraft, soldCountDraft, toSocialProofPayload } from "./social-proof-shared";

describe("social proof settings payload", () => {
  it("starts both features off, with the backend's defaults", () => {
    expect(soldCountDraft(undefined)).toMatchObject({ enabled: false, countFrom: "placed", minToShow: 10 });
    expect(purchaseToastDraft(undefined)).toMatchObject({ enabled: false, source: "real", gapSeconds: 30, staySeconds: 6 });
  });

  it("leaves blank wording out so the built-in text applies, and trims entries", () => {
    const payload = toSocialProofPayload(
      soldCountDraft({ enabled: true, label: { en: "  ", bn: "" } }),
      purchaseToastDraft({
        enabled: true,
        source: "custom",
        template: { en: " {name} ordered {product} " },
        entries: [{ productId: "p1", name: " Karim ", area: "", timeLabel: "  " }],
      }),
    );
    expect(payload.soldCount?.label).toBeUndefined();
    expect(payload.purchaseToast?.template).toEqual({ en: "{name} ordered {product}" });
    expect(payload.purchaseToast?.entries).toEqual([{ productId: "p1", name: "Karim" }]);
  });
});

describe("sold counts to save", () => {
  const rows = [
    { productId: "a", productName: "A", categoryId: null, categoryName: null, subcategoryId: null, subcategoryName: null, tagIds: [], status: "active", hasVariants: false, openingSold: 5, onlineSold: 1, total: 6 },
    { productId: "b", productName: "B", categoryId: null, categoryName: null, subcategoryId: null, subcategoryName: null, tagIds: [], status: "active", hasVariants: false, openingSold: 0, onlineSold: 0, total: 0 },
  ];

  it("filters by category and search together", () => {
    const withCats = [
      { ...rows[0], productName: "Red Cushion", categoryId: "c" },
      { ...rows[1], productName: "Blue Mat", categoryId: "m" },
    ];
    const by = (categoryId: string | null) => ({ ...NO_TAXONOMY_FILTER, categoryId });
    expect(filterSoldRows(withCats, { search: "", taxonomy: by("m") }).map((r) => r.productId)).toEqual(["b"]);
    expect(filterSoldRows(withCats, { search: "red", taxonomy: by(null) }).map((r) => r.productId)).toEqual(["a"]);
    expect(filterSoldRows(withCats, { search: "red", taxonomy: by("m") })).toEqual([]);
  });

  it("sends changed rows only, and a cleared box as 0", () => {
    expect(soldCountsToSave(rows, { a: 5, b: 30 })).toEqual([{ productId: "b", openingSold: 30 }]);
    expect(soldCountsToSave(rows, { a: null })).toEqual([{ productId: "a", openingSold: 0 }]);
  });
});
