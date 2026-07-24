import { describe, it, expect } from "vitest";
import {
  isPaymentOverdue,
  needsReactivation,
  shouldBlockWorkspaceAccess,
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

  it("blocks incomplete subscriptions", () => {
    expect(
      shouldBlockWorkspaceAccess(
        ent({ status: "active", subscriptionStatus: "incomplete" }),
      ),
    ).toBe(true);
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

describe("needsReactivation (canceled → billing gate)", () => {
  it("is true only for a canceled subscription", () => {
    expect(
      needsReactivation(ent({ status: "active", subscriptionStatus: "canceled" })),
    ).toBe(true);
    expect(
      needsReactivation(ent({ status: "inactive", subscriptionStatus: "canceled" })),
    ).toBe(true);
  });

  it("is false for active / past_due / incomplete / missing", () => {
    expect(
      needsReactivation(ent({ status: "active", subscriptionStatus: "active" })),
    ).toBe(false);
    expect(
      needsReactivation(ent({ status: "read_only", subscriptionStatus: "past_due" })),
    ).toBe(false);
    expect(
      needsReactivation(ent({ status: "active", subscriptionStatus: "incomplete" })),
    ).toBe(false);
    expect(needsReactivation(null)).toBe(false);
  });
});
