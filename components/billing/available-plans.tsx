"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useGetAvailablePlans,
  useGetSubscription,
  useRequestPlanChange,
} from "@/services/api";
import { TrialEndConfirmDialog } from "./trial-end-confirm-dialog";
import { TrialInfoModal } from "./trial-info-modal";
import { BillingCycleToggle } from "./billing-cycle-toggle";
import { PlanCard, type PlanCardState } from "./plan-card";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useFormatters } from "@/hooks/use-formatters";
import { formatCurrency } from "@/lib/currency";
import {
  getScheduledCancellation,
  getScheduledPlanChange,
} from "@/lib/subscription-utils";
import {
  defaultCadence,
  groupPlans,
  planCadences,
  resolvePlanChangeDirection,
  trialEndDateFrom,
  variantFor,
} from "@/utils/plan-groups";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AvailablePlan } from "@/types";

function PlansSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  );
}

/**
 * Shown when the plan list can't be fetched — never an empty space.
 *
 * A canceled or unpaid workspace is force-routed here by the protected layout
 * precisely so it "lands on a working page, not a wall of failed requests". If
 * Mission Control is unreachable (an ordinary degraded case, not an exception)
 * and this grid renders nothing, that merchant is stranded on a page offering
 * no plan, no error and no way to pay. Retry is the whole point of the card.
 */
function PlansLoadError({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const tPlans = useTranslations("settings.billing.plans");

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-5 shrink-0 text-destructive" />
          {tPlans("loadError")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {tPlans("retry")}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * The plan grid on the billing page: one card per PACKAGE, plus a billing-cycle
 * switch when a package is sold on more than one cadence.
 *
 * Grouping is not cosmetic — a tier sold monthly and yearly is two plans sharing
 * a `group`, and without collapsing them the grid shows two identical-looking
 * cards with the same name. See `utils/plan-groups.ts`.
 */
export function AvailablePlans() {
  const t = useTranslations("settings.billing");
  const tPlans = useTranslations("settings.billing.plans");
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { formatDate } = useFormatters();
  const { data: sub } = useGetSubscription();
  const { data, isLoading, isError, isFetching, refetch } = useGetAvailablePlans();
  const planChange = useRequestPlanChange();
  // Target plan awaiting the "your trial ends now" confirmation (null = closed).
  const [confirmPlan, setConfirmPlan] = useState<AvailablePlan | null>(null);
  // Target plan awaiting the "here's how the trial works" explainer, with the
  // trial end date stamped at the moment it opens (see `TrialInfoModal`).
  const [trialPrompt, setTrialPrompt] = useState<{
    plan: AvailablePlan;
    endsOn: string;
  } | null>(null);
  const [cycle, setCycle] = useState<number | null>(null);

  const plans = useMemo(() => data?.plans ?? [], [data]);
  const groups = useMemo(() => groupPlans(plans), [plans]);
  const cadences = useMemo(() => planCadences(groups), [groups]);

  if (isLoading) return <PlansSkeleton />;
  if (isError) {
    return <PlansLoadError onRetry={() => refetch()} isRetrying={isFetching} />;
  }
  // An empty catalogue is not a failure — MC simply offers this workspace
  // nothing to buy, and a card saying so would be noise.
  if (!data || plans.length === 0) return null;

  const entitlement = sub?.entitlement;
  // A canceled subscription has no "current" plan — every plan is a fresh
  // reactivation (checkout), so don't mark the old plan current or disable it.
  const isCanceled = entitlement?.subscriptionStatus === "canceled";
  const currentSlug = isCanceled ? undefined : entitlement?.planSlug;
  const currentPlan = currentSlug
    ? plans.find((p) => p.slug === currentSlug)
    : undefined;
  // On a live trial, switching to a different paid plan ends the trial now and
  // requires payment — confirm before proceeding.
  const isTrialing = !isCanceled && entitlement?.subscriptionStatus === "trialing";
  // The trial is one-time per workspace, so a spent trial must never be offered
  // again. `trialUsed` is absent on mirrors written before the field existed —
  // treat that as unused, matching the server default.
  const trialEligible = !entitlement?.trialUsed;
  const scheduledChange = getScheduledPlanChange(entitlement);
  // The backend rejects plan changes in these states (see MC BILLING.md §5.8):
  // a scheduled cancel must be resumed first (any change would clear it), and
  // an overdue sub must settle its invoice first (free is still allowed — that
  // is walking away from the paid plan, not acquiring one). Mirror that here so
  // the buttons don't offer actions that can only fail.
  const isCancelScheduled = !isCanceled && !!getScheduledCancellation(entitlement);
  const isPastDue = !isCanceled && entitlement?.subscriptionStatus === "past_due";
  const isChangeBlocked = (plan: AvailablePlan) =>
    isCancelScheduled || (isPastDue && plan.amount > 0);

  // Until the customer touches the switch, open on the cadence they are already
  // billed at — not the shortest one sold. A canceled sub still counts: their
  // old cadence is the better guess for the one they are coming back on.
  const selectedMonths = cycle ?? defaultCadence(cadences, entitlement);

  /** True when choosing this plan starts a free trial rather than a payment. */
  const startsTrial = (plan: AvailablePlan) =>
    trialEligible &&
    (plan.trialDays ?? 0) > 0 &&
    !isTrialing &&
    plan.slug !== currentSlug;

  /**
   * Route the click. Three gates, in order of how surprising they are:
   * a trial the customer has not seen explained, a paid switch that ends a
   * running trial, and everything else straight through.
   */
  const handleChange = (plan: AvailablePlan) => {
    if (planChange.isPending || isChangeBlocked(plan)) return;
    if (startsTrial(plan)) {
      setTrialPrompt({ plan, endsOn: trialEndDateFrom(plan.trialDays ?? 0) });
      return;
    }
    if (isTrialing && plan.amount > 0 && plan.slug !== currentSlug) {
      setConfirmPlan(plan);
      return;
    }
    proceedChange(plan);
  };

  const proceedChange = (plan: AvailablePlan) => {
    if (planChange.isPending) return;
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/billing`
        : undefined;

    planChange.mutate(
      { planSlug: plan.slug, returnUrl },
      {
        onSuccess: (res) => {
          const result = res.data;
          switch (result.mode) {
            case "checkout":
              // Hand off to the hosted Stripe/SSLCommerz page.
              window.location.href = result.url;
              break;
            case "scheduled":
              toast.success(
                t("toasts.downgradeScheduled", {
                  planName: result.planName,
                  date: formatDate(result.effectiveAt),
                }),
              );
              break;
            case "activated":
              toast.success(t("toasts.activated", { planName: result.planName }));
              break;
            case "current":
              toast.success(
                t("toasts.downgradeCancelled", { planName: result.planName }),
              );
              break;
          }
        },
      },
    );
  };

  const cardState = (plan: AvailablePlan): PlanCardState => ({
    isCurrent: currentSlug === plan.slug,
    isScheduled: scheduledChange?.planSlug === plan.slug,
    hasScheduledChange: !!scheduledChange,
    // Direction mirrors Mission Control's own rule (tier rank, then cadence) —
    // a raw amount comparison would label a cross-tier change "Downgrade" while
    // MC charges for it immediately. See `utils/plan-groups.ts`.
    direction:
      !currentPlan || currentPlan.slug === plan.slug
        ? null
        : resolvePlanChangeDirection(currentPlan, plan),
    disabled: planChange.isPending || isChangeBlocked(plan),
    startsTrial: startsTrial(plan),
  });

  return (
    <div className="space-y-4">
      <TrialInfoModal
        plan={trialPrompt?.plan ?? null}
        price={trialPrompt ? formatCurrency(trialPrompt.plan.amount, currency) : ""}
        endsOn={trialPrompt?.endsOn ?? null}
        onOpenChange={(open) => {
          if (!open) setTrialPrompt(null);
        }}
        onConfirm={() => {
          const plan = trialPrompt?.plan;
          setTrialPrompt(null);
          if (plan) proceedChange(plan);
        }}
      />
      <TrialEndConfirmDialog
        plan={confirmPlan}
        price={confirmPlan ? formatCurrency(confirmPlan.amount, currency) : ""}
        onOpenChange={(open) => {
          if (!open) setConfirmPlan(null);
        }}
        onConfirm={() => {
          const plan = confirmPlan;
          setConfirmPlan(null);
          if (plan) proceedChange(plan);
        }}
      />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{tPlans("title")}</h2>
        <p className="text-sm text-muted-foreground">{tPlans("subtitle")}</p>
        {isCancelScheduled && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {tPlans("blockedCancelScheduled")}
          </p>
        )}
        {!isCancelScheduled && isPastDue && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {tPlans("blockedPastDue")}
          </p>
        )}
        {!trialEligible && (
          <p className="text-sm text-muted-foreground">{tPlans("trialUsed")}</p>
        )}
      </div>

      {cadences.length > 1 && selectedMonths !== null && (
        <BillingCycleToggle
          cadences={cadences}
          selected={selectedMonths}
          onSelect={setCycle}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, index) => {
          const plan = variantFor(group, selectedMonths);
          // The tier below, so each card can list what it ADDS rather than
          // reciting the same eleven capabilities three times over. `groups`
          // arrives in `groupRank` order — the same order that decides upgrade
          // from downgrade — so the previous entry is the tier below by
          // construction, not by coincidence of sorting.
          //
          // Compared at the same cadence: a yearly card must not be diffed
          // against a monthly one, which could differ for reasons that have
          // nothing to do with the ladder.
          //
          // The name comes off the GROUP, like the card's own title, so the
          // heading keeps naming the same package when the cycle switch moves.
          const groupBelow = index > 0 ? groups[index - 1] : undefined;
          const previousTier = groupBelow
            ? {
                name: groupBelow.name,
                features: variantFor(groupBelow, selectedMonths).features,
              }
            : undefined;
          return (
            <PlanCard
              key={group.key}
              plan={plan}
              name={group.name}
              currency={currency}
              state={cardState(plan)}
              onChoose={() => handleChange(plan)}
              previousTier={previousTier}
            />
          );
        })}
      </div>
    </div>
  );
}
