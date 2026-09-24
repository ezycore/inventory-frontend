import { describe, it, expect } from "vitest";
import {
  graceDaysLeft,
  isInGrace,
  isPaymentOverdue,
  needsReactivation,
  shouldBlockWorkspaceAccess,
  trialDaysLeft,
} from "@/lib/subscription-utils";
import type { Entitlement } from "@/types";

const ent = (over: Partial<Entitlement>): Entitlement =>
  ({
    _id: "e1",
    organizationId: "o1",
    modules: [],
    features: {},
    limits: {},
    status: "active",
    ...over,
  }) as Entitlement;

describe("shouldBlockWorkspaceAccess (force logout gate)", () => {
  it("keeps active subscriptions", () => {
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "active", subscriptionStatus: "active" }),
      ),
    ).toBe(false);
  });

  it("keeps trialing subscriptions", () => {
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "active", subscriptionStatus: "trialing" }),
      ),
    ).toBe(false);
  });

  it("does NOT log out during grace / read-only (past_due)", () => {
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "read_only", subscriptionStatus: "past_due" }),
      ),
    ).toBe(false);
  });

  it("blocks a terminated (inactive) mirror", () => {
    expect(shouldBlockWorkspaceAccess(ent({ status: "inactive" }))).toBe(true);
  });

  it("does NOT log out canceled subscriptions — they reactivate instead", () => {
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "active", subscriptionStatus: "canceled" }),
      ),
    ).toBe(false);
    // MC also stamps status:inactive on a canceled org — must still not block.
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "inactive", subscriptionStatus: "canceled" }),
      ),
    ).toBe(false);
  });

  it("does not block an incomplete subscription — it must reach checkout", () => {
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "active", subscriptionStatus: "incomplete" }),
      ),
    ).toBe(false);
    // MC derives the mirror's status from the sub status, so every incomplete
    // sub arrives as status:inactive — the incomplete check must win over it.
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "inactive", subscriptionStatus: "incomplete" }),
      ),
    ).toBe(false);
  });

  it("blocks a missing entitlement", () => {
    expect(shouldBlockWorkspaceAccess(null)).toBe(true);
    expect(shouldBlockWorkspaceAccess(undefined)).toBe(true);
  });
});

describe("isPaymentOverdue (overdue banner gate)", () => {
  it("is false for healthy subscriptions", () => {
    expect(
      isPaymentOverdue(ent({ status: "active", subscriptionStatus: "active" })),
    ).toBe(false);
  });

  it("is true when subscriptionStatus is past_due", () => {
    expect(
      isPaymentOverdue(
        ent({ status: "read_only", subscriptionStatus: "past_due" }),
      ),
    ).toBe(true);
  });

  it("is true when the mirror is read_only", () => {
    expect(isPaymentOverdue(ent({ status: "read_only" }))).toBe(true);
  });

  it("is false with no entitlement", () => {
    expect(isPaymentOverdue(null)).toBe(false);
  });

  it("is false for a canceled subscription (that is reactivation, not overdue)", () => {
    expect(
      isPaymentOverdue(ent({ status: "active", subscriptionStatus: "canceled" })),
    ).toBe(false);
  });
});

describe("needsReactivation (canceled / unpaid → billing gate)", () => {
  it("is true for a canceled subscription", () => {
    expect(
      needsReactivation(ent({ status: "active", subscriptionStatus: "canceled" })),
    ).toBe(true);
    expect(
      needsReactivation(ent({ status: "inactive", subscriptionStatus: "canceled" })),
    ).toBe(true);
  });

  it("is true for an incomplete subscription awaiting its first payment", () => {
    expect(
      needsReactivation(ent({ status: "active", subscriptionStatus: "incomplete" })),
    ).toBe(true);
    expect(
      needsReactivation(ent({ status: "inactive", subscriptionStatus: "incomplete" })),
    ).toBe(true);
  });

  it("is false for active / past_due / missing", () => {
    expect(
      needsReactivation(ent({ status: "active", subscriptionStatus: "active" })),
    ).toBe(false);
    expect(
      needsReactivation(ent({ status: "read_only", subscriptionStatus: "past_due" })),
    ).toBe(false);
    expect(needsReactivation(null)).toBe(false);
  });
});

/**
 * Grace and the trial countdown. Both are day counts the merchant reads, so
 * partial days round **up**: a trial with two hours left says "1 day", never
 * "0 days" — and a window that has passed is gone, not zero.
 */
describe("grace and trial countdowns", () => {
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

  it("treats a future graceUntil as a live grace window", () => {
    expect(isInGrace(ent({ graceUntil: inDays(3) }))).toBe(true);
    expect(graceDaysLeft(ent({ graceUntil: inDays(3) }))).toBe(3);
  });

  it("forgets a grace window that has passed", () => {
    expect(isInGrace(ent({ graceUntil: inDays(-1) }))).toBe(false);
    expect(graceDaysLeft(ent({ graceUntil: inDays(-1) }))).toBeNull();
    expect(isInGrace(ent({}))).toBe(false);
  });

  // Grace keeps an unpaid workspace in the lenient tier — full app, overdue
  // banner — including the `incomplete` state an in-trial upgrade is held in.
  it("keeps a workspace in grace out of the billing-only tier", () => {
    const upgrading = ent({
      status: "inactive",
      subscriptionStatus: "incomplete",
      graceUntil: inDays(2),
    });
    expect(needsReactivation(upgrading)).toBe(false);
    expect(isPaymentOverdue(upgrading)).toBe(true);
    expect(shouldBlockWorkspaceAccess(upgrading)).toBe(false);
  });

  it("counts trial days only while the subscription is trialing", () => {
    expect(
      trialDaysLeft(ent({ subscriptionStatus: "trialing", trialEndsAt: inDays(2) })),
    ).toBe(2);
    // Rounds up: a trial with hours left still has a day on it.
    expect(
      trialDaysLeft(ent({ subscriptionStatus: "trialing", trialEndsAt: inDays(0.1) })),
    ).toBe(1);
    // Paid in advance: still `trialing` (that is what keeps their days), but
    // counting down at someone who has already paid is worse than silence.
    expect(
      trialDaysLeft(
        ent({
          subscriptionStatus: "trialing",
          trialEndsAt: inDays(2),
          trialPrepaid: true,
        }),
      ),
    ).toBeNull();
    // A past trial's end date lingers on an upgraded subscription.
    expect(
      trialDaysLeft(ent({ subscriptionStatus: "active", trialEndsAt: inDays(2) })),
    ).toBeNull();
    expect(
      trialDaysLeft(ent({ subscriptionStatus: "trialing", trialEndsAt: inDays(-1) })),
    ).toBeNull();
  });
});
