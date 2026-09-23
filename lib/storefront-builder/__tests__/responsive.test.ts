// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { responsiveClasses, responsiveVars } from "../responsive";

/**
 * The pair that carries a per-device setting into CSS: the variables, and the
 * classes that decide which screens read them.
 *
 * The classes exist because of a real failure. One class wrote both screens
 * (`--cols: var(--sfb-cols-m, var(--sfb-cols))`), so a merchant who set a PHONE
 * column count on a product row left `--sfb-cols` undefined on the desktop —
 * where the rule still applied, `--cols` computed to the guaranteed-invalid
 * value, and `repeat(var(--cols), …)` fell back to no grid at all. Answering
 * for the phone collapsed the desktop into one column.
 */
describe("responsiveVars", () => {
  it("writes nothing for a setting nobody answered", () => {
    expect(responsiveVars("sfb-cols", undefined)).toEqual({});
  });

  it("writes each screen the merchant answered for, and only those", () => {
    expect(responsiveVars("sfb-cols", { base: 4 })).toEqual({ "--sfb-cols": "4" });
    expect(responsiveVars("sfb-cols", { mobile: 2 })).toEqual({ "--sfb-cols-m": "2" });
    expect(responsiveVars("sfb-cols", { base: 4, mobile: 2 })).toEqual({
      "--sfb-cols": "4",
      "--sfb-cols-m": "2",
    });
  });

  it("takes a formatter, for a value CSS does not spell the same way", () => {
    expect(responsiveVars("sfb-space", { base: 40 }, (n) => `${n}px`)).toEqual({
      "--sfb-space": "40px",
    });
  });
});

describe("responsiveClasses", () => {
  it("names no class for a setting nobody answered", () => {
    expect(responsiveClasses("sfb-cols", undefined)).toBeUndefined();
    expect(responsiveClasses("sfb-cols", {})).toBeUndefined();
  });

  it("names one class per screen, so the other keeps the store's own value", () => {
    expect(responsiveClasses("sfb-cols", { base: 4 })).toBe("sfb-cols");
    expect(responsiveClasses("sfb-cols", { mobile: 2 })).toBe("sfb-cols-m");
    expect(responsiveClasses("sfb-cols", { base: 4, mobile: 2 })).toBe("sfb-cols sfb-cols-m");
  });

  it("treats an explicit zero as an answer", () => {
    // `!== undefined`, never truthiness: a stored 0 is out of every current
    // range, but a helper that silently dropped it would hide the value rather
    // than render it wrongly, which is the harder bug to find.
    expect(responsiveClasses("sfb-cols", { base: 0 })).toBe("sfb-cols");
  });
});
