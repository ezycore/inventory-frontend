// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  groupPlans,
  planCadences,
  resolvePlanChangeDirection,
  trialEndDateFrom,
  variantFor,
} from "./plan-groups";
import type { AvailablePlan } from "@/types";

/**
 * `resolvePlanChangeDirection` mirrors Mission Control's
 * `src/utils/plan-change-direction.ts`. These cases are deliberately the same
 * ones its test asserts — if the two ever disagree, a card labelled "Downgrade"
 * charges the customer immediately, which no type or lint check would catch.
 */
const plan = (over: Partial<AvailablePlan>): AvailablePlan => ({
  id: over.slug ?? "p",
  name: "Start",
  slug: "start-monthly",
  interval: "month",
  intervalCount: 1,
  amount: 399,
  modules: [],
  features: [],
  limits: {},
  ...over,
});

const startMonthly = plan({ slug: "start-monthly", amount: 399, group: "start", groupRank: 1 });
const startYearly = plan({
  slug: "start-yearly",
  amount: 3990,
  interval: "year",
  group: "start",
  groupRank: 1,
});
const proMonthly = plan({ slug: "pro-monthly", name: "Pro", amount: 999, group: "pro", groupRank: 2 });

describe("resolvePlanChangeDirection", () => {
  it("treats a longer cadence in the same package as an upgrade", () => {
    expect(resolvePlanChangeDirection(startMonthly, startYearly)).toBe("upgrade");
    expect(resolvePlanChangeDirection(startYearly, startMonthly)).toBe("downgrade");
  });

  it("ranks tiers before price — the regression this exists for", () => {
    // ৳3,990 > ৳999, so a raw amount comparison calls this a downgrade and the
    // button would read "Downgrade" while MC charges the customer immediately.
    expect(startYearly.amount).toBeGreaterThan(proMonthly.amount);
    expect(resolvePlanChangeDirection(startYearly, proMonthly)).toBe("upgrade");
    expect(resolvePlanChangeDirection(proMonthly, startYearly)).toBe("downgrade");
  });

  it("falls back to amount for ungrouped plans", () => {
    const cheap = plan({ slug: "a", amount: 100 });
    const dear = plan({ slug: "b", amount: 500 });
    expect(resolvePlanChangeDirection(dear, cheap)).toBe("downgrade");
    expect(resolvePlanChangeDirection(cheap, dear)).toBe("upgrade");
  });
});

describe("groupPlans", () => {
  it("collapses cadences of one package into a single card, shortest first", () => {
    const groups = groupPlans([startYearly, startMonthly, proMonthly]);
    expect(groups.map((g) => g.key)).toEqual(["start", "pro"]);
    expect(groups[0].variants.map((v) => v.slug)).toEqual([
      "start-monthly",
      "start-yearly",
    ]);
  });

  it("gives an ungrouped plan a card of its own", () => {
    const solo = plan({ slug: "legacy", amount: 100 });
    const groups = groupPlans([solo]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("legacy");
  });
});

describe("planCadences", () => {
  it("offers a switch only when a package really sells more than one cadence", () => {
    expect(planCadences(groupPlans([startMonthly, startYearly]))).toHaveLength(2);
  });

  it("returns nothing for ungrouped plans, so no inert switch renders", () => {
    // Each plan is its own group here, so the month counts differ but no card
    // could actually change — the switch must not appear at all.
    const monthly = plan({ slug: "a", amount: 399 });
    const yearly = plan({ slug: "b", amount: 3990, interval: "year" });
    expect(planCadences(groupPlans([monthly, yearly]))).toEqual([]);
  });

  it("computes the per-month saving of the longer cycle", () => {
    // ৳3,990/yr = ৳332.50/mo against ৳399/mo → 17% saved.
    const cadences = planCadences(groupPlans([startMonthly, startYearly]));
    expect(cadences[0]).toEqual({ months: 1, savePct: null });
    expect(cadences[1]).toEqual({ months: 12, savePct: 17 });
  });
});

describe("trialEndDateFrom", () => {
  it("adds whole days to the given instant", () => {
    const now = Date.parse("2026-08-13T09:00:00.000Z");
    expect(trialEndDateFrom(15, now)).toBe("2026-08-28T09:00:00.000Z");
  });

  it("returns the same instant for a zero-day trial", () => {
    const now = Date.parse("2026-08-13T09:00:00.000Z");
    expect(trialEndDateFrom(0, now)).toBe("2026-08-13T09:00:00.000Z");
  });
});

describe("variantFor", () => {
  it("falls back to the default cadence when the package lacks the selected one", () => {
    const [start, pro] = groupPlans([startMonthly, startYearly, proMonthly]);
    expect(variantFor(start, 12).slug).toBe("start-yearly");
    // Pro is monthly-only — it keeps showing its own price rather than vanishing.
    expect(variantFor(pro, 12).slug).toBe("pro-monthly");
  });
});
