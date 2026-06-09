"use client";

import {
  useGetAvailablePlans,
  useGetSubscription,
  useRequestPlanChange,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
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

const INTERVAL_LABELS: Record<string, string> = {
  month: "/mo",
  year: "/yr",
  one_time: "",
};

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
  const currency = useAuthStore((s) => s.user?.organization?.currency);
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
                `Downgrade to ${result.planName} scheduled for ${new Date(
                  result.effectiveAt,
                ).toLocaleDateString()}. You keep your current plan until then.`,
              );
              break;
            case "activated":
              toast.success(`You're now on the ${result.planName} plan.`);
              break;
            case "current":
              toast.success(
                `Downgrade cancelled. You'll stay on the ${result.planName} plan.`,
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
        <h2 className="text-lg font-semibold tracking-tight">Available Plans</h2>
        <p className="text-sm text-muted-foreground">
          Compare plans and change your subscription.
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
                    {isScheduled && <Badge variant="secondary">Scheduled</Badge>}
                    {isCurrent && <Badge>Current</Badge>}
                  </div>
                </div>
                {plan.description && (
                  <CardDescription>{plan.description}</CardDescription>
                )}
                <div className="pt-2">
                  <span className="text-2xl font-bold">
                    {formatCurrency(plan.amount, currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {INTERVAL_LABELS[plan.interval] ?? ""}
                  </span>
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
                    Downgrade Scheduled
                  </Button>
                ) : isCurrent && scheduledChange ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    Cancel Downgrade
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : currentAmount == null ? (
                  <Button
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    Choose Plan
                  </Button>
                ) : direction === "upgrade" ? (
                  <Button
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    <ArrowUpCircle className="size-4" />
                    Upgrade
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={planChange.isPending}
                    onClick={() => handleChange(plan)}
                  >
                    <ArrowDownCircle className="size-4" />
                    Downgrade
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
