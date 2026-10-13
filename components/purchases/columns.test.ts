// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import type { Translator } from "@/i18n/config";
import { getPurchaseColumns } from "./columns";

/**
 * The column between Sale Price and Cost Price is `price − cost` per unit. With the
 * supplier's discount terms that is the discount; without, it is the shop's margin, and
 * calling it "Discount" read as money off the purchase (shadow test S9).
 */
const t = ((key: string) => key) as unknown as Translator;
const headers = (withoutDiscountTerms?: boolean) =>
  getPurchaseColumns(vi.fn(), vi.fn(), String, "s1", t, false, false, false, undefined, withoutDiscountTerms).map(
    (c) => c.header,
  );

describe("purchase line columns — Discount vs Margin", () => {
  it("names it Discount when the supplier gives one", () => {
    expect(headers(false)).toContain("items.colDiscount");
    expect(headers(false)).not.toContain("items.colMargin");
  });

  it("names it Margin (per unit) when the supplier gives none", () => {
    expect(headers(true)).toContain("items.colMargin");
    expect(headers(true)).not.toContain("items.colDiscount");
  });
});
