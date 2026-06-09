"use client";

import { useGetSubscription } from "@/services/api";
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
import { Progress } from "@/ui/components/progress";
import { Skeleton } from "@/ui/components/skeleton";
import { AlertCircle, CalendarClock, CheckCircle2, CreditCard } from "lucide-react";
import type { Entitlement, SubscriptionUsage } from "@/types";

const FEATURE_LABELS: Record<string, string> = {
  sales: "Sales",
  accounts: "Accounts",
  expiryTracking: "Expiry Tracking",
  barcodeSystem: "Barcode System",
  invoicePrinting: "Invoice Printing",
  returns: "Returns",
  uomConversion: "UOM Conversion",
};

const INTERVAL_LABELS: Record<string, string> = {
  month: "Monthly",
  year: "Yearly",
  one_time: "One-time",
};

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
 */
const LIMIT_USAGE: Record<
  string,
  { label: string; usageKey: keyof SubscriptionUsage }
> = {
  locations: { label: "Locations", usageKey: "locations" },
  maxLocations: { label: "Locations", usageKey: "locations" },
  users: { label: "Users", usageKey: "users" },
  maxUsers: { label: "Users", usageKey: "users" },
  inventory: { label: "Inventory Products", usageKey: "inventory" },
  maxInventoryProducts: { label: "Inventory Products", usageKey: "inventory" },
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PlanSummary({ entitlement }: { entitlement: Entitlement }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const subStatus = entitlement.subscriptionStatus ?? entitlement.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-5 text-muted-foreground" />
          {entitlement.planName ?? entitlement.planSlug ?? "Current Plan"}
        </CardTitle>
        <CardDescription>Your active subscription</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Detail label="Status">
          <Badge variant={SUB_STATUS_VARIANT[subStatus] ?? "secondary"}>
            {subStatus.replace(/_/g, " ")}
          </Badge>
        </Detail>
        <Detail label="Billing">
          {entitlement.interval
            ? INTERVAL_LABELS[entitlement.interval] ?? entitlement.interval
            : "—"}
        </Detail>
        <Detail label="Amount">
          {entitlement.amount != null
            ? formatCurrency(entitlement.amount, currency)
            : "—"}
        </Detail>
        <Detail label="Gateway">{entitlement.gateway ?? "—"}</Detail>
        <Detail label="Current period ends">
          {formatDate(entitlement.currentPeriodEnd)}
        </Detail>
        <Detail label="Trial ends">
          {formatDate(entitlement.trialEndsAt)}
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
  const scheduledChange = getScheduledPlanChange(entitlement);
  if (!scheduledChange) return null;

  const planLabel =
    scheduledChange.planName || scheduledChange.planSlug || "the selected plan";
  const changeLabel =
    scheduledChange.type === "upgrade" ? "upgrade" : "downgrade";

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <CardContent className="flex items-start gap-3 py-4">
        <CalendarClock className="mt-0.5 size-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            Plan {changeLabel} scheduled
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Your plan will change to {planLabel} on{" "}
            {formatDate(scheduledChange.effectiveAt)}. You keep your current
            plan until then.
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
  const rows = Object.entries(entitlement.limits ?? {})
    .map(([key, max]) => {
      const meta = LIMIT_USAGE[key];
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
        <CardTitle>Usage &amp; Limits</CardTitle>
        <CardDescription>
          Current usage against your plan limits
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
  const features = entitlement.features ?? {};
  const entries = Object.entries(features);
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Features</CardTitle>
        <CardDescription>Modules included with your plan</CardDescription>
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
              {FEATURE_LABELS[key] ?? key}
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
  const { data, isLoading, isError } = useGetSubscription();

  if (isLoading) return <BillingSkeleton />;

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <AlertCircle className="size-5 text-destructive" />
          Failed to load subscription details. Please try again.
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
            No active plan
          </CardTitle>
          <CardDescription>
            No subscription is currently linked to your organization. Contact
            your administrator if you believe this is an error.
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
