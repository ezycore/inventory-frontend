// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { discountForEditedPrice, isMrpEdited, mrpPerBaseUnit } from "./helpers";

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
