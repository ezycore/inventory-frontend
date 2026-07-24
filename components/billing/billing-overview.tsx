"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useGetSubscription } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useFormatters } from "@/hooks/use-formatters";
import { formatCurrency } from "@/lib/currency";
import {
  getScheduledCancellation,
  getScheduledPlanChange,
} from "@/lib/subscription-utils";
import {
  CancelSubscriptionButton,
  ScheduledCancellationBanner,
  isCancelable,
} from "@/components/billing/cancel-subscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Progress } from "@/ui/components/progress";
import { Skeleton } from "@/ui/components/skeleton";
import { AlertCircle, CalendarClock, CheckCircle2, CreditCard } from "lucide-react";
import type { Entitlement, SubscriptionUsage } from "@/types";

const SUB_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  canceled: "destructive",
  incomplete: "outline",
};

/**
 * The usage categories the billing meter renders, in order. Each resolves its
 * ceiling from the entitlement's `limits` map by alias — MC may store a limit
 * under either key form, and we mirror the backend's `LIMIT_ALIASES`
 * (plan-limits.ts) so the meter reads the same value enforcement does. The card
 * is driven off this fixed list, not off the `limits` map's keys: an entitlement
 * with `limits: {}` (e.g. an unlimited enterprise plan) still renders every row,
 * each as "unlimited", instead of showing an empty card.
 */
const USAGE_CATEGORIES: {
  labelKey: string;
  usageKey: keyof SubscriptionUsage;
  aliases: string[];
}[] = [
  { labelKey: "locations", usageKey: "locations", aliases: ["maxLocations", "locations"] },
  { labelKey: "users", usageKey: "users", aliases: ["maxUsers", "users"] },
  {
    labelKey: "inventory",
    usageKey: "inventory",
    aliases: ["maxInventoryProducts", "maxProducts", "inventory", "products"],
  },
  { labelKey: "salesPerDay", usageKey: "salesToday", aliases: ["salesPerDay", "maxSalesPerDay"] },
  {
    labelKey: "purchasePerDay",
    usageKey: "purchasesToday",
    aliases: ["purchasePerDay", "maxPurchasePerDay"],
  },
];

/**
 * First positive alias value in the limits map, or `undefined` when none is set.
 * A missing or non-positive ceiling means "unlimited" — the same convention the
 * backend enforces (plan-limits.ts resolveLimit) and MC/marketing use.
 */
function resolveLimit(
  limits: Record<string, number>,
  aliases: string[],
): number | undefined {
  for (const alias of aliases) {
    const value = limits[alias];
    if (typeof value === "number" && value > 0) return value;
  }
  return undefined;
}

function PlanSummary({ entitlement }: { entitlement: Entitlement }) {
  const t = useTranslations("settings.billing.plan");
  const tInterval = useTranslations("settings.billing.interval");
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { formatDate } = useFormatters();
  const subStatus = entitlement.subscriptionStatus ?? entitlement.status;

  // Honors intervalCount — a 6-month plan reads "Every 6 months", not "Monthly".
  const intervalLabel = (interval?: string, intervalCount?: number) => {
    if (!interval) return "—";
    const n = intervalCount ?? 1;
    if (interval === "month")
      return n > 1 ? tInterval("everyNMonths", { n }) : tInterval("month");
    if (interval === "year") return tInterval("year");
    if (interval === "one_time") return tInterval("oneTime");
    return interval;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-5 text-muted-foreground" />
          {entitlement.planName ?? entitlement.planSlug ?? t("title")}
        </CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Detail label={t("status")}>
          <Badge variant={SUB_STATUS_VARIANT[subStatus] ?? "secondary"}>
            {subStatus.replace(/_/g, " ")}
          </Badge>
        </Detail>
        <Detail label={t("billing")}>
          {intervalLabel(entitlement.interval, entitlement.intervalCount)}
        </Detail>
        <Detail label={t("amount")}>
          {entitlement.amount != null
            ? formatCurrency(entitlement.amount, currency)
            : "—"}
        </Detail>
        <Detail label={t("gateway")}>{entitlement.gateway ?? "—"}</Detail>
        <Detail label={t("periodEnds")}>
          {entitlement.currentPeriodEnd
            ? formatDate(entitlement.currentPeriodEnd)
            : "—"}
        </Detail>
        <Detail label={t("trialEnds")}>
          {entitlement.trialEndsAt ? formatDate(entitlement.trialEndsAt) : "—"}
        </Detail>
      </CardContent>
      {isCancelable(entitlement) && !getScheduledCancellation(entitlement) && (
        <CardFooter className="justify-end border-t pt-4">
          <CancelSubscriptionButton entitlement={entitlement} />
        </CardFooter>
      )}
    </Card>
  );
}

function ScheduledPlanChangeBanner({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const t = useTranslations("settings.billing.scheduledChange");
  const { formatDate } = useFormatters();
  const scheduledChange = getScheduledPlanChange(entitlement);
  if (!scheduledChange) return null;

  const planLabel =
    scheduledChange.planName || scheduledChange.planSlug || "—";

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <CardContent className="flex items-start gap-3 py-4">
        <CalendarClock className="mt-0.5 size-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            {scheduledChange.type === "upgrade" ? t("upgradeTitle") : t("downgradeTitle")}
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-400">
            {t("body", { plan: planLabel, date: formatDate(scheduledChange.effectiveAt) })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function UsageCard({
  entitlement,
  usage,
}: {
  entitlement: Entitlement;
  usage: SubscriptionUsage;
}) {
  const t = useTranslations("settings.billing.usage");
  const limits = entitlement.limits ?? {};
  const rows = USAGE_CATEGORIES.map((cat) => {
    const max = resolveLimit(limits, cat.aliases);
    const used = usage[cat.usageKey] ?? 0;
    const unlimited = max === undefined;
    const pct = unlimited ? 0 : Math.min((used / max) * 100, 100);
    return { key: cat.labelKey, label: t(cat.labelKey), used, max, pct, unlimited };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map((row) => {
          const atLimit = row.max !== undefined && row.used >= row.max;
          return (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span
                  className={
                    atLimit
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  {row.unlimited
                    ? `${row.used} / ${t("unlimited")}`
                    : `${row.used} / ${row.max}`}
                </span>
              </div>
              {row.unlimited ? null : <Progress value={row.pct} />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FeaturesCard({ entitlement }: { entitlement: Entitlement }) {
  const t = useTranslations("settings.billing.features");
  const features = entitlement.features ?? {};
  const entries = Object.entries(features);
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, enabled]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            {enabled ? (
              <CheckCircle2 className="size-4 text-emerald-500" />
            ) : (
              <AlertCircle className="size-4 text-muted-foreground/50" />
            )}
            <span className={enabled ? "" : "text-muted-foreground"}>
              {t.has(key as never) ? t(key as never) : key}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function BillingOverview() {
  const t = useTranslations("settings.billing.plan");
  const { data, isLoading, isError } = useGetSubscription();

  if (isLoading) return <BillingSkeleton />;

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <AlertCircle className="size-5 text-destructive" />
          {t("loadError")}
        </CardContent>
      </Card>
    );
  }

  const entitlement = data?.entitlement ?? null;
  const usage = data?.usage ?? {
    locations: 0,
    users: 0,
    inventory: 0,
    salesToday: 0,
    purchasesToday: 0,
  };

  if (!entitlement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" />
            {t("noActiveTitle")}
          </CardTitle>
          <CardDescription>
            {t("noActiveDescription")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ScheduledCancellationBanner entitlement={entitlement} />
      <ScheduledPlanChangeBanner entitlement={entitlement} />
      <PlanSummary entitlement={entitlement} />
      <div className="grid gap-4 md:grid-cols-2">
        <UsageCard entitlement={entitlement} usage={usage} />
        <FeaturesCard entitlement={entitlement} />
      </div>
    </div>
  );
}
