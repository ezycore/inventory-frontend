/**
 * How money prints in the shop.
 *
 * These pin two judgement calls that a "tidy-up" would happily undo, because
 * both look like arbitrary formatting until you know what they cost:
 *
 * - the **sign**, not the ISO code (`BDT 800.00` reads like a remittance form)
 * - decimals **only when the amount has them** (a hard 2 put a meaningless
 *   `.00` on every price in the catalogue and widened every discount badge)
 *
 * The taka sign is written as `৳` rather than pasted, so the expectation
 * stays readable in a terminal that cannot render Bengali.
 */
import { describe, it, expect } from "vitest";

import { money, formatMoney, discountPct } from "@/components/storefront/format";

const TAKA = "৳";

describe("money", () => {
  it("uses the taka sign, not the ISO code", () => {
    expect(money(800, "BDT")).toContain(TAKA);
    expect(money(800, "BDT")).not.toContain("BDT");
  });

  it("drops the decimals on a whole amount", () => {
    expect(money(800, "BDT")).toBe(`${TAKA}800`);
    expect(money(45, "BDT")).toBe(`${TAKA}45`);
  });

  /**
   * The half that cannot be dropped: campaign maths produces real fractions
   * (10% off 89 is 80.10), and rounding those away would misstate what the
   * shopper is actually charged.
   */
  it("keeps exactly two decimals when the amount has them", () => {
    expect(money(80.1, "BDT")).toBe(`${TAKA}80.10`);
    expect(money(1250.5, "BDT")).toBe(`${TAKA}1,250.50`);
  });

  it("groups thousands", () => {
    expect(money(3024, "BDT")).toBe(`${TAKA}3,024`);
  });

  /**
   * Float noise out of a percentage calculation must not print `800.00` next to
   * a neighbouring `800`.
   */
  it("treats a hair over a whole number as whole", () => {
    expect(money(800.000000001, "BDT")).toBe(`${TAKA}800`);
  });

  it("stays currency-agnostic", () => {
    expect(money(12.5, "USD")).toBe("$12.50");
    expect(money(12, "USD")).toBe("$12");
  });

  it("defaults to BDT — every caller that omits the currency is a BD store", () => {
    expect(money(500)).toBe(`${TAKA}500`);
  });

  it("shows a zero rather than a blank", () => {
    expect(money(0, "BDT")).toBe(`${TAKA}0`);
    expect(money(null, "BDT")).toBe(`${TAKA}0`);
    expect(money(undefined, "BDT")).toBe(`${TAKA}0`);
  });

  it("survives a currency code Intl cannot read", () => {
    expect(money(800, "NOTACURRENCY")).toContain("800");
  });
});

describe("formatMoney", () => {
  /**
   * These were two functions formatting the same thing differently — the
   * storefront and the admin printing the same price two ways. They are one
   * implementation now, and this is what stops them drifting apart again.
   */
  it("is identical to money", () => {
    for (const v of [800, 80.1, 0, 3024, 1250.5]) {
      expect(formatMoney(v, "BDT")).toBe(money(v, "BDT"));
    }
  });
});

describe("discountPct", () => {
  it("rounds to a whole percent", () => {
    expect(discountPct(34, 45)).toBe(24);
    expect(discountPct(80.1, 89)).toBe(10);
  });

  it("is 0 when there is no real discount", () => {
    expect(discountPct(100, 100)).toBe(0);
    expect(discountPct(100, 90)).toBe(0);
    expect(discountPct(100, null)).toBe(0);
  });
});
