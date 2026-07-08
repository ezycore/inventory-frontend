import type { Entitlement, ScheduledPlanChange } from "@/types";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function hasActiveSubscription(entitlement?: Entitlement | null) {
  if (!entitlement || entitlement.status !== "active") return false;

  const subscriptionStatus = entitlement.subscriptionStatus;
  return (
    !subscriptionStatus || ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  );
}

/**
 * Whether the workspace should be hard-blocked (force logout → login).
 *
 * Only genuinely terminated subscriptions block access: no entitlement at all,
 * an `inactive` mirror (canceled / suspended / incomplete), or a subscription
 * that Stripe reports `canceled` / `incomplete`. A **past_due** subscription is
 * NOT blocked here — during grace/read-only the user keeps read access and sees
 * the overdue banner instead of a confusing "no active subscription" logout.
 */
export function shouldBlockWorkspaceAccess(entitlement?: Entitlement | null) {
  if (!entitlement) return true;
  if (entitlement.status === "inactive") return true;
  const sub = entitlement.subscriptionStatus;
  return sub === "canceled" || sub === "incomplete";
}

/**
 * Whether a payment is overdue (grace or read-only). Drives the in-app overdue
 * banner. MC maps `past_due` → entitlement `read_only`, so either signal means
 * the invoice lapsed and the emailed pay link is the way to settle it.
 */
export function isPaymentOverdue(entitlement?: Entitlement | null) {
  if (!entitlement) return false;
  return (
    entitlement.subscriptionStatus === "past_due" ||
    entitlement.status === "read_only"
  );
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
