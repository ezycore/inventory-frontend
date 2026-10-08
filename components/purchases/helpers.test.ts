// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  discountForEditedPrice,
  hasDiscountTerms,
  isMrpEdited,
  linePricingAfterEdit,
  mrpPerBaseUnit,
  openingLinePricing,
} from "./helpers";

describe("editable purchase Price (MRP)", () => {
  it("keeps cost and re-derives the discount when Price changes", () => {
    expect(discountForEditedPrice(120, 80)).toBe(40);
    // Buying above the new MRP: no negative discount.
    expect(discountForEditedPrice(70, 80)).toBe(0);
  });

  it("flags only a real change from the line's starting price", () => {
    expect(isMrpEdited(120, 100)).toBe(true);
    expect(isMrpEdited(100, 100)).toBe(false);
    // Float noise from price × factor is not an edit.
    expect(isMrpEdited(99.96, 8.33 * 12)).toBe(false);
  });

  it("never treats a cleared (zero) Price as a new MRP", () => {
    expect(isMrpEdited(0, 100)).toBe(false);
  });

  it("divides a pack price down to the per-unit MRP the backend stores", () => {
    expect(mrpPerBaseUnit(100, 12)).toBe(8.33);
    expect(mrpPerBaseUnit(50, 1)).toBe(50);
    expect(mrpPerBaseUnit(50, 0)).toBe(50);
  });
});

describe("add-product row pricing — with and without a supplier discount", () => {
  const none = { type: "percentage" as const, value: 0 };
  const tenPct = { type: "percentage" as const, value: 10 };

  it("is in discount mode only when the supplier discount is above 0", () => {
    expect(hasDiscountTerms(none)).toBe(false);
    expect(hasDiscountTerms(tenPct)).toBe(true);
    expect(hasDiscountTerms({ type: "fixed", value: 5 })).toBe(true);
  });

  it("opens a picked product at the recorded cost when there is no discount", () => {
    expect(openingLinePricing(1200, 900, none)).toEqual({ price: 1200, discount: 0, costPrice: 900 });
    // Never bought before: the sale price is the only guess.
    expect(openingLinePricing(1200, 0, none)).toEqual({ price: 1200, discount: 0, costPrice: 1200 });
  });

  it("opens a picked product at price − the supplier's discount when there is one", () => {
    expect(openingLinePricing(1200, 900, tenPct)).toEqual({ price: 1200, discount: 120, costPrice: 1080 });
  });

  it("never invents a discount without terms — typing a Sale Price leaves cost alone", () => {
    // The 1200 / 1200 / 0 row: a new product (price 0, cost 0), then Sale Price 1200.
    expect(linePricingAfterEdit("price", { price: 1200, discount: 0, costPrice: 0 }, none)).toEqual({ discount: 0 });
    expect(linePricingAfterEdit("costPrice", { price: 1200, discount: 0, costPrice: 800 }, none)).toEqual({ discount: 0 });
  });

  it("re-applies the supplier's terms when Sale Price changes in discount mode", () => {
    expect(linePricingAfterEdit("price", { price: 1500, discount: 120, costPrice: 1080 }, tenPct)).toEqual({
      discount: 150,
      costPrice: 1350,
    });
  });

  it("keeps price − discount = cost when Discount or Cost Price is typed in discount mode", () => {
    expect(linePricingAfterEdit("discount", { price: 1200, discount: 200, costPrice: 1080 }, tenPct)).toEqual({ costPrice: 1000 });
    expect(linePricingAfterEdit("costPrice", { price: 1200, discount: 120, costPrice: 1000 }, tenPct)).toEqual({ discount: 200 });
    // Cost above price: no negative discount.
    expect(linePricingAfterEdit("costPrice", { price: 1200, discount: 0, costPrice: 1300 }, tenPct)).toEqual({ discount: 0 });
  });
});
