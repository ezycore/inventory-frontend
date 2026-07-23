"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  useGetAvailablePlans,
  useGetSubscription,
  useRequestPlanChange,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useFormatters } from "@/hooks/use-formatters";
import { formatCurrency } from "@/lib/currency";
import { getScheduledPlanChange } from "@/lib/subscription-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { ArrowDownCircle, ArrowUpCircle, Check } from "lucide-react";
import { toast } from "sonner";
import type { AvailablePlan } from "@/types";
import { cn } from "@/ui/lib/utils";

function PlansSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function AvailablePlans() {
  const t = useTranslations("settings.billing");
  const tPlans = useTranslations("settings.billing.plans");
  const tInterval = useTranslations("settings.billing.interval");
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { formatDate } = useFormatters();
  const { data: sub } = useGetSubscription();
  const { data, isLoading, isError } = useGetAvailablePlans();
  const planChange = useRequestPlanChange();

  if (isLoading) return <PlansSkeleton />;
  if (isError || !data) return null;

  const plans = data.plans ?? [];
  if (plans.length === 0) return null;

  const currentSlug = sub?.entitlement?.planSlug;
  const currentAmount = sub?.entitlement?.amount ?? null;
  const scheduledChange = getScheduledPlanChange(sub?.entitlement);

  // Suffix honors intervalCount — a 6-month plan is "/6 mo", never "/mo".
  const intervalSuffix = (plan: AvailablePlan) => {
    const n = plan.intervalCount ?? 1;
    if (plan.interval === "month")
      return n > 1 ? tInterval("everyNMonthsSuffix", { n }) : tInterval("monthSuffix");
    if (plan.interval === "year")
      return n > 1 ? tInterval("everyNYearsSuffix", { n }) : tInterval("yearSuffix");
    return "";
  };

  // Whole-number % off vs the anchor price; MC only sends compareAtAmount
  // when it is a real discount, but never trust a struck price ≤ the real one.
  const discountPct = (plan: AvailablePlan) =>
    plan.compareAtAmount && plan.compareAtAmount > plan.amount
      ? Math.round((1 - plan.amount / plan.compareAtAmount) * 100)
      : null;

  const handleChange = (plan: AvailablePlan) => {
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

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{tPlans("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {tPlans("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentSlug === plan.slug;
          const isScheduled = scheduledChange?.planSlug === plan.slug;
          const direction: "upgrade" | "downgrade" | null =
            isCurrent || currentAmount == null
              ? null
              : plan.amount > currentAmount
                ? "upgrade"
                : plan.amount < currentAmount
                  ? "downgrade"
                  : null;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                isCurrent && "border-primary ring-1 ring-primary",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {isScheduled && <Badge variant="secondary">{tPlans("scheduled")}</Badge>}
                    {isCurrent && <Badge>{tPlans("current")}</Badge>}
                  </div>
                </div>
                {plan.description && (
                  <CardDescription>{plan.description}</CardDescription>
                )}
                <div className="pt-2">
                  {discountPct(plan) !== null && (
                    <span className="mr-2 text-sm text-muted-foreground line-through">
                      {formatCurrency(plan.compareAtAmount as number, currency)}
                    </span>
                  )}
                  <span className="text-2xl font-bold">
                    {formatCurrency(plan.amount, currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {intervalSuffix(plan)}
                  </span>
                  {discountPct(plan) !== null && (
                    <Badge variant="secondary" className="ml-2 align-middle">
                      {tPlans("offBadge", { pct: discountPct(plan) as number })}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="size-4 text-emerald-500" />
                        <span className="capitalize">
                          {f.replace(/([A-Z])/g, " $1")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {isScheduled ? (
                  <Button variant="outline" className="w-full" disabled>
                    {tPlans("downgradeScheduledBtn")}
                  </Button>
                ) : isCurrent && scheduledChange ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    {tPlans("cancelDowngrade")}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    {tPlans("currentPlanBtn")}
                  </Button>
                ) : currentAmount == null ? (
                  <Button
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    {tPlans("choosePlan")}
                  </Button>
                ) : direction === "upgrade" ? (
                  <Button
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    <ArrowUpCircle className="size-4" />
                    {tPlans("upgrade")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    <ArrowDownCircle className="size-4" />
                    {tPlans("downgrade")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
