import type { Entitlement, ScheduledPlanChange } from "@/types";

/**
 * How the current entitlement gates workspace access — the single state machine
 * both the layout gate and the overdue banner derive from:
 *  - `active`    → full access (active / trialing).
 *  - `read_only` → overdue but recoverable (past_due / read_only): keep the user
 *    in with the overdue banner + "Pay now" instead of logging them out.
 *  - `blocked`   → terminated / never provisioned (missing / inactive /
 *    canceled / incomplete): force logout → login.
 *
 * Mirrors the backend classifier `entitlementAccess` in
 * `easystock-backend/src/utils/subscription-status.ts` — keep the two in sync.
 */
export type SubscriptionAccess = "active" | "read_only" | "blocked";

export function classifyEntitlementAccess(
  entitlement?: Entitlement | null,
): SubscriptionAccess {
  if (!entitlement) return "blocked";
  if (entitlement.status === "inactive") return "blocked";
  const sub = entitlement.subscriptionStatus;
  if (sub === "canceled" || sub === "incomplete") return "blocked";
  if (sub === "past_due" || entitlement.status === "read_only") {
    return "read_only";
  }
  return "active";
}

/** Whether the workspace should be hard-blocked (force logout → login). */
export function shouldBlockWorkspaceAccess(entitlement?: Entitlement | null) {
  return classifyEntitlementAccess(entitlement) === "blocked";
}

/** Whether a payment is overdue (grace / read-only) — drives the overdue banner. */
export function isPaymentOverdue(entitlement?: Entitlement | null) {
  return classifyEntitlementAccess(entitlement) === "read_only";
}

function normalizeScheduledChange(
  value: unknown,
): ScheduledPlanChange | null {
  if (!value || typeof value !== "object") return null;

  const change = value as Record<string, unknown>;
  const effectiveAt =
    change.effectiveAt ??
    change.effectiveDate ??
    change.scheduledAt ??
    change.downgradeAt ??
    change.currentPeriodEnd;

  if (typeof effectiveAt !== "string" || !effectiveAt) return null;

  const planSlug = change.planSlug ?? change.targetPlanSlug ?? change.nextPlanSlug;
  const planName = change.planName ?? change.targetPlanName ?? change.nextPlanName;

  if (typeof planSlug !== "string" && typeof planName !== "string") {
    return null;
  }

  return {
    type:
      change.type === "upgrade" || change.type === "downgrade"
        ? change.type
        : "downgrade",
    planSlug: typeof planSlug === "string" ? planSlug : "",
    planName: typeof planName === "string" ? planName : undefined,
    effectiveAt,
  };
}

export function getScheduledPlanChange(
  entitlement?: Entitlement | null,
): ScheduledPlanChange | null {
  if (!entitlement) return null;

  const direct =
    entitlement.pendingPlanChange ??
    entitlement.scheduledPlanChange ??
    entitlement.scheduledChange ??
    entitlement.pendingDowngrade;

  const normalizedDirect = normalizeScheduledChange(direct);
  if (normalizedDirect) return normalizedDirect;

  const mirror = entitlement as Entitlement & Record<string, unknown>;
  const effectiveAt =
    mirror.pendingPlanEffectiveAt ??
    mirror.nextPlanEffectiveAt ??
    mirror.downgradeEffectiveAt ??
    mirror.scheduledDowngradeAt;

  if (typeof effectiveAt !== "string" || !effectiveAt) return null;

  const planSlug = mirror.pendingPlanSlug ?? mirror.nextPlanSlug;
  const planName = mirror.pendingPlanName ?? mirror.nextPlanName;

  if (typeof planSlug !== "string" && typeof planName !== "string") {
    return null;
  }

  return {
    type: "downgrade",
    planSlug: typeof planSlug === "string" ? planSlug : "",
    planName: typeof planName === "string" ? planName : undefined,
    effectiveAt,
  };
}
