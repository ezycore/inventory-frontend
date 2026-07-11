"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useGetSubscription } from "@/services/api";
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
import { Progress } from "@/ui/components/progress";
import { Skeleton } from "@/ui/components/skeleton";
import { AlertCircle, CalendarClock, CheckCircle2, CreditCard } from "lucide-react";
import type { Translator } from "@/i18n/config";
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
 * Maps an entitlement limit key to a live usage count.
 * Limit keys are standardized by Mission Control (the source of truth).
 * `t` is bound to `settings.billing.usage`.
 */
const getLimitUsage = (
  t: Translator,
): Record<string, { label: string; usageKey: keyof SubscriptionUsage }> => ({
  locations: { label: t("locations"), usageKey: "locations" },
  maxLocations: { label: t("locations"), usageKey: "locations" },
  users: { label: t("users"), usageKey: "users" },
  maxUsers: { label: t("users"), usageKey: "users" },
  inventory: { label: t("inventory"), usageKey: "inventory" },
  maxInventoryProducts: { label: t("inventory"), usageKey: "inventory" },
});

function PlanSummary({ entitlement }: { entitlement: Entitlement }) {
  const t = useTranslations("settings.billing.plan");
  const tInterval = useTranslations("settings.billing.interval");
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { formatDate } = useFormatters();
  const subStatus = entitlement.subscriptionStatus ?? entitlement.status;

  const intervalLabel = (interval?: string) => {
    if (!interval) return "—";
    if (interval === "month") return tInterval("month");
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
          {intervalLabel(entitlement.interval)}
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
  const limitUsage = getLimitUsage(t);
  const rows = Object.entries(entitlement.limits ?? {})
    .map(([key, max]) => {
      const meta = limitUsage[key];
      if (!meta) return null;
      const used = usage[meta.usageKey] ?? 0;
      const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
      return { key, label: meta.label, used, max, pct };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

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
          const atLimit = row.used >= row.max;
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
                  {row.used} / {row.max}
                </span>
              </div>
              <Progress value={row.pct} />
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
  const usage = data?.usage ?? { locations: 0, users: 0, inventory: 0 };

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
      <ScheduledPlanChangeBanner entitlement={entitlement} />
      <PlanSummary entitlement={entitlement} />
      <div className="grid gap-4 md:grid-cols-2">
        <UsageCard entitlement={entitlement} usage={usage} />
        <FeaturesCard entitlement={entitlement} />
      </div>
    </div>
  );
}
