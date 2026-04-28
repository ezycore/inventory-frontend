"use client";

import { format } from "date-fns";
import { CreditCard } from "lucide-react";

import { useBillingSubscription } from "@/services/api";
import { Skeleton } from "@ui/components/skeleton";
import { Alert, AlertDescription } from "@ui/components/alert";

import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { FeaturesGrid } from "@/components/billing/features-grid";
import { LimitsCard } from "@/components/billing/limits-card";

export default function BillingPage() {
  const { data, isLoading, isError, error } = useBillingSubscription();
  const payload = data?.data;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CreditCard className="size-6" />
            Subscription &amp; Billing
          </h1>
          <p className="text-muted-foreground text-sm">
            Plan, lifecycle status, and feature flags mirrored from YoCore.
            Billing changes are managed in your YoCore account.
          </p>
        </div>
        {payload?.subscription && (
          <p className="text-muted-foreground text-xs whitespace-nowrap">
            Last synced{" "}
            {format(new Date(payload.subscription.updatedAt), "PPpp")}
          </p>
        )}
      </header>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full md:col-span-2" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {(error as Error)?.message ??
              "Failed to load subscription details."}
          </AlertDescription>
        </Alert>
      )}

      {payload && (
        <>
          <SubscriptionBanner
            organizationStatus={payload.organization.status}
            deletionScheduledAt={payload.organization.deletionScheduledAt}
            subscription={payload.subscription}
          />

          {!payload.subscription ? (
            <Alert>
              <AlertDescription>
                No subscription is linked to this workspace yet. Once your
                YoCore plan is activated it will appear here automatically.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <SubscriptionCard subscription={payload.subscription} />
              <LimitsCard limits={payload.subscription.limits} />
            </div>
          )}

          <FeaturesGrid features={payload.features} />
        </>
      )}
    </div>
  );
}
