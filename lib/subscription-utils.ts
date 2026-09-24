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
  | "status"
  | "subscriptionStatus"
  | "cancelAtPeriodEnd"
  | "cancelAt"
  | "currentPeriodEnd"
  | "trialEndsAt"
  | "trialPrepaid"
  | "graceUntil"
>;

/** Whole days from now until `date`, rounded up, or null when it is absent or
 * already past. A trial ending in two hours has "1 day left", not "0" — the
 * merchant reads a day count, not a duration. */
function daysUntil(date?: string | null): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}

/**
 * Whether the workspace is inside a **grace** window: unpaid, but deliberately
 * still fully usable (storefront included) until `graceUntil`. Mission Control
 * grants it when a trial lapses unpaid, when a renewal fails, and while an
 * in-trial upgrade waits for payment.
 *
 * Mirrors `isInGrace` in `easystock-backend/src/utils/subscription-status.ts`.
 */
export function isInGrace(entitlement?: EntitlementAccessFields | null): boolean {
  return daysUntil(entitlement?.graceUntil) !== null;
}

/** Days left in the grace window, or null when there is no live grace. */
export function graceDaysLeft(entitlement?: EntitlementAccessFields | null) {
  return daysUntil(entitlement?.graceUntil);
}

/**
 * Whether the current trial has already been paid for in advance.
 *
 * True only while the prepayment is *parked*: Mission Control clears the flag
 * when it is spent on the first invoice, at which point the subscription is
 * plainly `active` and there is nothing special left to say. Guarded on
 * `trialing` as well as the flag, because a stale flag on an activated
 * subscription would otherwise claim a trial that is over.
 */
export function isTrialPrepaid(entitlement?: EntitlementAccessFields | null) {
  return (
    entitlement?.subscriptionStatus === "trialing" &&
    entitlement.trialPrepaid === true
  );
}

/** Days left on a running trial that still needs paying for, or null.
 *
 * Drives the in-app countdown — the merchant's only notice inside the app that
 * a trial is about to end. A **prepaid** trial returns null: it is still
 * `trialing` (that is what preserves the days they paid for), but counting down
 * at someone who has already paid, under a "Pay now" that resolves to nothing,
 * is worse than saying nothing at all. */
export function trialDaysLeft(entitlement?: EntitlementAccessFields | null) {
  if (entitlement?.subscriptionStatus !== "trialing") return null;
  if (isTrialPrepaid(entitlement)) return null;
  return daysUntil(entitlement.trialEndsAt);
}

export function classifyEntitlementAccess(
  entitlement?: EntitlementAccessFields | null,
): SubscriptionAccess {
  if (!entitlement) return "blocked";
  const sub = entitlement.subscriptionStatus;
  // Grace outranks every tier the status alone would give, `inactive` included —
  // the two states that most need it arrive looking terminal (a lapsed trial is
  // `past_due`, an in-trial upgrade held for payment is `incomplete`). Keep in
  // step with the backend classifier, which resolves it in the same position.
  if (isInGrace(entitlement)) return "read_only";
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
