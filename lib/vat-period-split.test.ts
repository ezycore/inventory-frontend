// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { describeVatPeriodSplit } from "./vat-period-split";

describe("describeVatPeriodSplit", () => {
  it("flags a mid-month change as a split period", () => {
    const s = describeVatPeriodSplit("2026-07-12");
    expect(s.isMidPeriod).toBe(true);
    expect(s.effectiveDay).toBe(12);
    expect(s.lastDay).toBe(31);
    expect(s.monthKey).toBe("2026-07");
  });

  it("does NOT flag the 1st — that is a clean period boundary", () => {
    expect(describeVatPeriodSplit("2026-08-01").isMidPeriod).toBe(false);
  });

  it("gets the month length right, including February in a leap year", () => {
    expect(describeVatPeriodSplit("2026-02-10").lastDay).toBe(28);
    expect(describeVatPeriodSplit("2028-02-10").lastDay).toBe(29);
    expect(describeVatPeriodSplit("2026-04-10").lastDay).toBe(30);
  });

  it("parses a yyyy-MM-dd string as UTC, not local", () => {
    // The DatePicker emits yyyy-MM-dd precisely to avoid the BDT/UTC off-by-one;
    // parsing it locally here would reintroduce it and shift the split by a day.
    const s = describeVatPeriodSplit("2026-07-01");
    expect(s.effectiveDay).toBe(1);
    expect(s.isMidPeriod).toBe(false);
  });
});
