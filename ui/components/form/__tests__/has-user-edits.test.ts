// coding-standard: maintained

import { describe, expect, it } from "vitest";
import { hasUserEdits } from "../form-utils";

describe("hasUserEdits (what the discard prompt reads, S45)", () => {
  it("nothing touched", () => {
    expect(hasUserEdits({})).toBe(false);
    expect(hasUserEdits(undefined)).toBe(false);
  });

  it("a top-level, nested or field-array edit counts", () => {
    expect(hasUserEdits({ name: true })).toBe(true);
    expect(hasUserEdits({ saleUnit: { unitId: true } })).toBe(true);
    expect(hasUserEdits({ variants: [undefined, { price: true }] })).toBe(true);
  });

  it("empty containers left behind after an edit was undone do not", () => {
    expect(hasUserEdits({ saleUnit: {}, variants: [undefined, {}] })).toBe(false);
    expect(hasUserEdits({ name: false })).toBe(false);
  });
});
