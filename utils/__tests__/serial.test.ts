// coding-standard: maintained
/**
 * The serial helpers must spell codes exactly like the backend does — a
 * mismatch makes the "already sold" warning miss, silently.
 */
import { describe, expect, it } from "vitest";
import {
  duplicateSerials,
  fitSerialSlots,
  isLikelyImei,
  normalizeSerial,
  normalizeSerials,
} from "../serial";

describe("serial helpers", () => {
  it("normalises spacing and case, keeps hyphens (backend parity)", () => {
    expect(normalizeSerial("  ab 12-cd\t34 ")).toBe("AB12-CD34");
    expect(normalizeSerials(["a", "  ", "b c"])).toEqual(["A", "BC"]);
  });

  it("recognises a valid IMEI by its Luhn digit", () => {
    expect(isLikelyImei("490154203237518")).toBe(true);
    expect(isLikelyImei("490154203237519")).toBe(false);
    expect(isLikelyImei("49015420323751")).toBe(false);
  });

  it("finds codes entered twice, whatever their spacing", () => {
    expect([...duplicateSerials(["A1", "a 1", "B2"])]).toEqual(["A1"]);
  });

  it("fits codes to the quantity — trims extras, pads blanks", () => {
    expect(fitSerialSlots(["A", "B", "C"], 2)).toEqual(["A", "B"]);
    expect(fitSerialSlots(["A"], 3)).toEqual(["A", "", ""]);
    expect(fitSerialSlots(undefined, 0)).toEqual([]);
  });
});
