"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useFeatureLabel } from "@/hooks/use-feature-label";
import { formatCurrency } from "@/lib/currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { ArrowDownCircle, ArrowUpCircle, Check, Sparkles } from "lucide-react";
import type { AvailablePlan } from "@/types";
import type { PlanChangeDirection } from "@/utils/plan-groups";
import { cn } from "@/ui/lib/utils";

/** Everything the card needs to know about this plan's relationship to the sub. */
export interface PlanCardState {
  isCurrent: boolean;
  isScheduled: boolean;
  /** True when the current plan has a pending downgrade that can be cancelled. */
  hasScheduledChange: boolean;
  /** null when there is no current plan to compare against (fresh/canceled). */
  direction: PlanChangeDirection | null;
  disabled: boolean;
  /** True when picking this plan starts a free trial rather than a payment. */
  startsTrial: boolean;
}

/**
 * One plan card in the billing grid. Extracted from `AvailablePlans` so that
 * component stays an orchestrator — it owns the cadence selection, the grouping
 * and the two dialogs, and would otherwise be well past the size where a React
 * component should be split.
 *
 * The card renders whichever cadence variant the caller picked; the package name
 * comes from the group, so a card does not rename itself when the billing-cycle
 * switch moves.
 */
export function PlanCard({
  plan,
  name,
  currency,
  state,
  onChoose,
}: {
  plan: AvailablePlan;
  name: string;
  currency?: string;
  state: PlanCardState;
  onChoose: () => void;
}) {
  const tPlans = useTranslations("settings.billing.plans");
  const tInterval = useTranslations("settings.billing.interval");
  const featureLabel = useFeatureLabel();

  // Suffix honors intervalCount — a 6-month plan is "/6 mo", never "/mo".
  const intervalSuffix = () => {
    const n = plan.intervalCount ?? 1;
    if (plan.interval === "month")
      return n > 1 ? tInterval("everyNMonthsSuffix", { n }) : tInterval("monthSuffix");
    if (plan.interval === "year")
      return n > 1 ? tInterval("everyNYearsSuffix", { n }) : tInterval("yearSuffix");
    return "";
  };

  // Whole-number % off vs the anchor price; MC only sends compareAtAmount when
  // it is a real discount, but never trust a struck price ≤ the real one.
  const discountPct =
    plan.compareAtAmount && plan.compareAtAmount > plan.amount
      ? Math.round((1 - plan.amount / plan.compareAtAmount) * 100)
      : null;

  return (
    <Card className={cn("relative", state.isCurrent && "border-primary ring-1 ring-primary")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          <div className="flex items-center gap-2">
            {state.isScheduled && <Badge variant="secondary">{tPlans("scheduled")}</Badge>}
            {state.isCurrent && <Badge>{tPlans("current")}</Badge>}
          </div>
        </div>
        {plan.description && <CardDescription>{plan.description}</CardDescription>}
        <div className="pt-2">
          {discountPct !== null && (
            <span className="mr-2 text-sm text-muted-foreground line-through">
              {formatCurrency(plan.compareAtAmount as number, currency)}
            </span>
          )}
          <span className="text-2xl font-bold">{formatCurrency(plan.amount, currency)}</span>
          <span className="text-sm text-muted-foreground">{intervalSuffix()}</span>
          {discountPct !== null && (
            <Badge variant="secondary" className="ml-2 align-middle">
              {tPlans("offBadge", { pct: discountPct })}
            </Badge>
          )}
        </div>
        {state.startsTrial && (
          <p className="flex items-center gap-1.5 pt-1 text-sm font-medium text-emerald-600 dark:text-emerald-500">
            <Sparkles className="size-3.5" />
            {tPlans("trialAvailable", { days: plan.trialDays ?? 0 })}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <PlanLimits limits={plan.limits} />

        {plan.features.length > 0 && (
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4 text-emerald-500" />
                {/* Was `capitalize` over a camelCase split, which rendered
                    "Uom Conversion" and "Sms Notifications" (QA-049). */}
                <span>{featureLabel(f)}</span>
              </li>
            ))}
          </ul>
        )}

        <PlanCardAction state={state} onChoose={onChoose} />
      </CardContent>
    </Card>
  );
}

/**
 * The tier ladder, on the card.
 *
 * Every plan grants **every** feature by design, so the features list below is
 * identical on all three cards — which left a merchant comparing ৳399, ৳599 and
 * ৳999 with nothing to compare. The limits ARE the ladder, and until 2026-08-16
 * they appeared nowhere in-app even though the public pricing page has shown
 * them all along.
 *
 * `0` (or a missing key) means unlimited — the same convention `plan-limits.ts`
 * enforces backend-side with `value > 0`.
 */
function PlanLimits({ limits }: { limits: Record<string, number> }) {
  const tPlans = useTranslations("settings.billing.plans");
  const tUsage = useTranslations("settings.billing.usage");

  const rows: Array<[string, number | undefined]> = [
    [tUsage("locations"), limits?.maxLocations],
    [tUsage("users"), limits?.maxUsers],
    [tUsage("inventory"), limits?.maxInventoryProducts],
    [tUsage("storage"), limits?.storageGb],
  ];
  if (rows.every(([, v]) => v === undefined)) return null;

  return (
    <div className="space-y-1.5 rounded-md bg-muted/40 p-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {tPlans("limitsTitle")}
      </p>
      {rows.map(([label, value]) =>
        value === undefined ? null : (
          <div key={label} className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">
              {value > 0 ? value.toLocaleString() : tUsage("unlimited")}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/** The single button at the foot of a card — one branch per subscription state. */
function PlanCardAction({
  state,
  onChoose,
}: {
  state: PlanCardState;
  onChoose: () => void;
}) {
  const tPlans = useTranslations("settings.billing.plans");

  if (state.isScheduled) {
    return (
      <Button variant="outline" className="w-full" disabled>
        {tPlans("downgradeScheduledBtn")}
      </Button>
    );
  }

  if (state.isCurrent && state.hasScheduledChange) {
    return (
      <Button variant="outline" className="w-full" disabled={state.disabled} onClick={onChoose}>
        {tPlans("cancelDowngrade")}
      </Button>
    );
  }

  if (state.isCurrent) {
    return (
      <Button variant="outline" className="w-full" disabled>
        {tPlans("currentPlanBtn")}
      </Button>
    );
  }

  // No current plan to compare against, or the plan starts a trial: a neutral
  // call to action rather than an up/down arrow that implies a price change.
  if (state.direction === null || state.startsTrial) {
    return (
      <Button className="w-full" disabled={state.disabled} onClick={onChoose}>
        {state.startsTrial ? tPlans("startTrial") : tPlans("choosePlan")}
      </Button>
    );
  }

  if (state.direction === "upgrade") {
    return (
      <Button className="w-full" disabled={state.disabled} onClick={onChoose}>
        <ArrowUpCircle className="size-4" />
        {tPlans("upgrade")}
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full" disabled={state.disabled} onClick={onChoose}>
      <ArrowDownCircle className="size-4" />
      {tPlans("downgrade")}
    </Button>
  );
}
