// coding-standard: maintained
import type { Entitlement, ScheduledPlanChange } from "@/types";

/**
 * How the current entitlement gates workspace access — the single state machine
 * both the layout gate and the overdue banner derive from:
 *  - `active`     → full access (active / trialing).
 *  - `read_only`  → overdue but recoverable (past_due / read_only): keep the user
 *    in with the overdue banner + "Pay now" instead of logging them out.
 *  - `reactivate` → data retained, but the user is routed to billing to subscribe
 *    or re-subscribe (the backend confines them to billing routes). Not a logout,
 *    not "Pay now". Two states land here, and both need to reach checkout:
 *    CANCELED (a deliberate cancel — cancel never deletes) and INCOMPLETE
 *    (awaiting a first payment: a paid signup, or a trial that ended unpaid).
 *  - `blocked`    → terminated / never provisioned (missing entitlement, or
 *    `inactive` with no recoverable subscription state): force logout → login.
 *
 * Mirrors the backend classifier `entitlementAccess` in
 * `easystock-backend/src/utils/subscription-status.ts` — keep the two in sync.
 */
export type SubscriptionAccess = "active" | "read_only" | "reactivate" | "blocked";

/**
 * The fields the access classifier (and everything built on it below) reads
 * — a `Pick`, not the whole `Entitlement`, so the layout gate and the overdue
 * banner can run on `useGetSubscriptionStatus()`'s minimal, permission-free
 * payload (no `amount`/`planSlug`/etc.) as well as the full one from
 * `useGetSubscription()`. Every existing caller already passes a full
 * `Entitlement`, which satisfies this by definition — purely a widening.
 */
export type EntitlementAccessFields = Pick<
  Entitlement,
  "status" | "subscriptionStatus" | "cancelAtPeriodEnd" | "cancelAt" | "currentPeriodEnd"
>;

export function classifyEntitlementAccess(
  entitlement?: EntitlementAccessFields | null,
): SubscriptionAccess {
  if (!entitlement) return "blocked";
  const sub = entitlement.subscriptionStatus;
  // Both billing-only states are resolved BEFORE the inactive→blocked branch.
  // MC derives the mirror's `status` from the subscription status, so a canceled
  // sub arrives as `status:inactive` + `subscriptionStatus:canceled` and an
  // incomplete one as `status:inactive` + `subscriptionStatus:incomplete`.
  // Reading `status` first would send both to `blocked` and lock the customer
  // out of the checkout they need to reach.
  if (sub === "canceled" || sub === "incomplete") return "reactivate";
  if (entitlement.status === "inactive") return "blocked";
  if (sub === "past_due" || entitlement.status === "read_only") {
    return "read_only";
  }
  return "active";
}

/** Whether the workspace should be hard-blocked (force logout → login). */
export function shouldBlockWorkspaceAccess(entitlement?: EntitlementAccessFields | null) {
  return classifyEntitlementAccess(entitlement) === "blocked";
}

/** Whether a payment is overdue (grace / read-only) — drives the overdue banner. */
export function isPaymentOverdue(entitlement?: EntitlementAccessFields | null) {
  return classifyEntitlementAccess(entitlement) === "read_only";
}

/**
 * Whether the workspace is confined to billing — canceled, or awaiting a first
 * payment. The user is let into the app but should be routed to billing to
 * subscribe or re-subscribe. Their data is retained either way.
 */
export function needsReactivation(entitlement?: EntitlementAccessFields | null) {
  return classifyEntitlementAccess(entitlement) === "reactivate";
}

/**
 * The standing at-period-end cancellation, or null. Returns the effective date
 * (`cancelAt`, falling back to `currentPeriodEnd`) so the billing UI can render
 * "cancels on {date}". Distinct from a scheduled *plan change* — a cancel ends
 * the subscription outright, it does not move to another plan.
 */
export function getScheduledCancellation(
  entitlement?: EntitlementAccessFields | null,
): { effectiveAt: string } | null {
  if (!entitlement?.cancelAtPeriodEnd) return null;
  const effectiveAt = entitlement.cancelAt ?? entitlement.currentPeriodEnd;
  if (typeof effectiveAt !== "string" || !effectiveAt) return null;
  return { effectiveAt };
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
