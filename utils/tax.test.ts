import { describe, it, expect } from "vitest";
import { computeLineTax, computeOrderTax, type TaxLineInput } from "@/utils/tax";

describe("computeLineTax", () => {
  it("adds tax on top for exclusive lines", () => {
    const r = computeLineTax({ price: 100, quantity: 2, taxRate: 15, taxType: "exclusive" });
    expect(r.base).toBe(200);
    expect(r.taxAmount).toBe(30);
    expect(r.lineTotal).toBe(230);
  });

  it("backs tax out of the price for inclusive lines", () => {
    const r = computeLineTax({ price: 115, quantity: 1, taxRate: 15, taxType: "inclusive" });
    expect(r.base).toBe(100);
    expect(r.taxAmount).toBe(15);
    expect(r.lineTotal).toBe(115);
  });

  it("defaults to inclusive when taxType omitted", () => {
    const r = computeLineTax({ price: 100, quantity: 1, taxRate: 15 });
    expect(r.taxType).toBe("inclusive");
    expect(r.taxAmount).toBe(13.04); // 100 - 100/1.15
    expect(r.lineTotal).toBe(100);
  });

  it("applies per-unit line discount before tax", () => {
    const r = computeLineTax({ price: 100, quantity: 2, discount: 20, taxRate: 10, taxType: "exclusive" });
    expect(r.base).toBe(160); // (100-20)*2
    expect(r.taxAmount).toBe(16);
    expect(r.lineTotal).toBe(176);
  });

  it("returns zero tax for zero / missing rate", () => {
    const r = computeLineTax({ price: 50, quantity: 2 });
    expect(r.taxAmount).toBe(0);
    expect(r.lineTotal).toBe(100);
  });

  it("rounds exclusive tax to 2dp", () => {
    const r = computeLineTax({ price: 9.99, quantity: 3, taxRate: 7.5, taxType: "exclusive" });
    expect(r.base).toBe(29.97);
    expect(r.taxAmount).toBe(2.25); // 29.97 * 7.5% = 2.24775
    expect(r.lineTotal).toBe(32.22);
  });

  it("rounds inclusive base/tax to 2dp and preserves the gross", () => {
    const r = computeLineTax({ price: 100, quantity: 1, taxRate: 7.5, taxType: "inclusive" });
    expect(r.base).toBe(93.02);
    expect(r.taxAmount).toBe(6.98);
    expect(r.lineTotal).toBe(100);
  });

  it("treats invalid numbers as zero", () => {
    const r = computeLineTax({ price: -5, quantity: 2, taxRate: 10, taxType: "exclusive" });
    expect(r.base).toBe(0);
    expect(r.taxAmount).toBe(0);
  });
});

describe("computeOrderTax", () => {
  it("rolls up a single exclusive line", () => {
    const r = computeOrderTax([{ price: 100, quantity: 2, taxRate: 15, taxType: "exclusive" }], 0);
    expect(r.itemsSubtotal).toBe(200);
    expect(r.addedTax).toBe(30);
    expect(r.includedTax).toBe(0);
    expect(r.taxTotal).toBe(30);
    expect(r.grandTotal).toBe(230);
  });

  it("rolls up a single inclusive line (tax already in subtotal)", () => {
    const r = computeOrderTax([{ price: 115, quantity: 1, taxRate: 15, taxType: "inclusive" }], 0);
    expect(r.itemsSubtotal).toBe(115);
    expect(r.addedTax).toBe(0);
    expect(r.includedTax).toBe(15);
    expect(r.taxTotal).toBe(15);
    expect(r.grandTotal).toBe(115);
  });

  it("applies order discount before exclusive tax", () => {
    const r = computeOrderTax([{ price: 100, quantity: 1, taxRate: 15, taxType: "exclusive" }], 10);
    expect(r.additionalDiscount).toBe(10);
    expect(r.addedTax).toBe(13.5); // tax on 90, not 100
    expect(r.grandTotal).toBe(103.5);
  });

  it("spreads order discount proportionally across lines", () => {
    const items: TaxLineInput[] = [
      { price: 100, quantity: 1, taxRate: 10, taxType: "exclusive" },
      { price: 300, quantity: 1, taxRate: 10, taxType: "exclusive" },
    ];
    const r = computeOrderTax(items, 40);
    expect(r.itemsSubtotal).toBe(400);
    expect(r.lines[0].base).toBe(90); // 100 - 40*0.25
    expect(r.lines[1].base).toBe(270); // 300 - 40*0.75
    expect(r.addedTax).toBe(36); // 9 + 27
    expect(r.grandTotal).toBe(396); // 400 - 40 + 36
  });

  it("handles mixed inclusive + exclusive lines", () => {
    const r = computeOrderTax([
      { price: 100, quantity: 1, taxRate: 15, taxType: "exclusive" },
      { price: 115, quantity: 1, taxRate: 15, taxType: "inclusive" },
    ], 0);
    expect(r.itemsSubtotal).toBe(215);
    expect(r.addedTax).toBe(15);
    expect(r.includedTax).toBe(15);
    expect(r.taxTotal).toBe(30);
    expect(r.grandTotal).toBe(230); // 215 + 15 added
  });

  it("clamps an order discount larger than the subtotal", () => {
    const r = computeOrderTax([{ price: 100, quantity: 1, taxRate: 10, taxType: "exclusive" }], 500);
    expect(r.additionalDiscount).toBe(100);
    expect(r.lines[0].base).toBe(0);
    expect(r.addedTax).toBe(0);
    expect(r.grandTotal).toBe(0);
  });

  it("returns zeros for an empty order", () => {
    const r = computeOrderTax([], 0);
    expect(r.itemsSubtotal).toBe(0);
    expect(r.taxTotal).toBe(0);
    expect(r.grandTotal).toBe(0);
    expect(r.lines).toEqual([]);
    expect(r.breakdownByRate).toEqual([]);
  });

  it("groups breakdown by rate + type and skips zero-rate lines", () => {
    const r = computeOrderTax([
      { price: 100, quantity: 1, taxRate: 15, taxType: "exclusive" },
      { price: 200, quantity: 1, taxRate: 15, taxType: "exclusive" },
      { price: 50, quantity: 1 }, // no tax
    ], 0);
    expect(r.breakdownByRate).toHaveLength(1);
    expect(r.breakdownByRate[0]).toMatchObject({
      taxRate: 15,
      taxType: "exclusive",
      taxableBase: 300,
      taxAmount: 45,
    });
  });

  it("keeps separate breakdown rows for the same rate with different type", () => {
    const r = computeOrderTax([
      { price: 100, quantity: 1, taxRate: 15, taxType: "exclusive" },
      { price: 115, quantity: 1, taxRate: 15, taxType: "inclusive" },
    ], 0);
    expect(r.breakdownByRate).toHaveLength(2);
  });
});

/**
 * The order discount is granted in full, to the paisa.
 *
 * The mirror of the backend's `describe("order discount — rounding residual")`
 * in `src/services/__tests__/tax-contract.test.ts`. Both sides spread the
 * discount proportionally and rounded each line to 2dp without reconciling the
 * sum, so a discount that did not divide cleanly left the order a paisa short —
 * ৳100 / ৳5,200 / ৳600 less ৳150 came to ৳5,750.01 (QA-T1-A).
 *
 * Frontend and backend AGREED on the wrong number, which is why nothing caught
 * it: the FE/BE contract test was green throughout. Reconciling on one side
 * only would have converted a rounding bug into a preview/save mismatch, so
 * these cases exist in both repos with the same figures.
 */
describe("computeOrderTax — order discount rounding residual", () => {
  const cart: TaxLineInput[] = [
    { price: 100, quantity: 1 },
    { price: 5200, quantity: 1 },
    { price: 600, quantity: 1 },
  ];

  it("grants the exact discount on the cart that found the bug", () => {
    expect(computeOrderTax(cart, 150).grandTotal).toBe(5750);
  });

  it("lands the residual on the largest line", () => {
    const r = computeOrderTax(cart, 150);

    // The two small lines keep their own rounded shares; the big one absorbs
    // the paisa, where it cannot round a line below zero or be noticed.
    expect(r.lines[0].lineTotal).toBe(97.46);
    expect(r.lines[2].lineTotal).toBe(584.75);
    expect(r.lines[1].lineTotal).toBe(5067.79);
  });

  it("still grants it exactly with tax on top", () => {
    const taxed: TaxLineInput[] = cart.map((l) => ({
      ...l,
      taxRate: 15,
      taxType: "exclusive",
    }));

    expect(computeOrderTax(taxed, 150).grandTotal).toBe(6612.5);
  });

  it("leaves a discount that divides cleanly untouched", () => {
    expect(
      computeOrderTax(
        [
          { price: 500, quantity: 1 },
          { price: 500, quantity: 1 },
        ],
        100,
      ).grandTotal,
    ).toBe(900);
  });

  it("grants the whole cart as a discount without going negative", () => {
    const r = computeOrderTax(
      [
        { price: 33.33, quantity: 1 },
        { price: 66.67, quantity: 1 },
      ],
      100,
    );

    expect(r.grandTotal).toBe(0);
    expect(r.lines.every((l) => l.lineTotal >= 0)).toBe(true);
  });

  it("is a no-op with no discount", () => {
    expect(computeOrderTax(cart, 0).grandTotal).toBe(5900);
  });

  it("handles a single line", () => {
    expect(
      computeOrderTax([{ price: 999.99, quantity: 1 }], 33.33).grandTotal,
    ).toBe(966.66);
  });

  it("survives an empty cart", () => {
    expect(computeOrderTax([], 50).grandTotal).toBe(0);
  });
});
