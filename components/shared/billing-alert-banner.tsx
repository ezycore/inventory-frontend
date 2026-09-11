// coding-standard: maintained
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, CalendarX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetSubscription,
  useGetSubscriptionStatus,
  useRequestPayLink,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatCurrency } from "@/lib/currency";
import { isPaymentOverdue, needsReactivation } from "@/lib/subscription-utils";
import { useCanManageBilling } from "@/hooks/use-has-permission";
import { Button } from "@/ui/components/button";

/**
 * App-wide banner shown when the subscription payment is overdue (past_due /
 * grace / read-only). "Pay now" fetches a live pay link on demand from Mission
 * Control (SSLCommerz session for SSL plans, Stripe hosted invoice for card) and
 * redirects — no hunting through the emailed link. Rendered in the protected
 * layout alongside the demo banner; hidden for healthy subscriptions.
 *
 * Everyone sees the message — a degraded workspace needs explaining to whoever
 * hits it — but only a billing manager gets the actions, since both lead to a
 * page they cannot open and "Pay now" mints a real payment session.
 *
 * Two data sources, on purpose: `status` (permission-free) is what decides
 * whether the banner renders at all, so it works for every role. `full` only
 * fires for a billing manager and supplies the one thing `status` withholds —
 * the owed `amount` — so the copy can say "of ৳X" for the person who can act
 * on it, without a non-billing-manager 403ing just to render the same banner.
 */
export function BillingAlertBanner() {
  const t = useTranslations("settings.billing.alert");
  const status = useGetSubscriptionStatus();
  const canManageBilling = useCanManageBilling();
  const full = useGetSubscription(canManageBilling);
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const payLink = useRequestPayLink();

  const entitlement = status.data?.entitlement;
  const bold = { strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> };

  // Billing-confined tier: data is retained but the workspace cannot be used
  // until a plan is paid for. Two states land here and they are NOT the same
  // sentence — `canceled` ended a subscription the customer had, `incomplete`
  // never started one (a trial that ran out, or a signup before the money
  // landed). Telling a first-time customer to "reactivate" is nonsense, so the
  // copy branches while the banner itself stays single-source.
  if (entitlement && needsReactivation(entitlement)) {
    const neverStarted = entitlement.subscriptionStatus === "incomplete";
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-700 dark:text-amber-400">
        <div className="flex items-center gap-2 text-sm">
          <CalendarX className="h-4 w-4 shrink-0" />
          <span>
            {t.rich(
              neverStarted ? "waitingOnPayment" : "subscriptionEnded",
              bold,
            )}
          </span>
        </div>
        {canManageBilling && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-amber-500/50 bg-transparent text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
          >
            <Link href="/dashboard/billing">
              {t(neverStarted ? "choosePlan" : "reactivate")}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (!entitlement || !isPaymentOverdue(entitlement)) return null;

  const fullAmount = canManageBilling ? full.data?.entitlement?.amount : undefined;
  const amount = fullAmount != null ? formatCurrency(fullAmount, currency) : null;

  const handlePayNow = () => {
    payLink.mutate(undefined, {
      onSuccess: (res) => {
        const data = res.data;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        // A payment is owed but no link could be produced — don't tell the user
        // they're paid up. Point them at the emailed invoice / a retry.
        if (data?.status === "due") {
          toast.error(t("payLinkFailed"));
          return;
        }
        // Genuinely nothing due (already settled / manual plan) — refresh so the
        // banner clears once the mirror catches up. `status` drives whether the
        // banner renders at all; `full` only matters here for a billing manager.
        toast.info(t("nothingDue"));
        status.refetch();
        if (canManageBilling) full.refetch();
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive dark:bg-destructive/20">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          {amount
            ? t.rich("overdueWithAmount", { ...bold, amount })
            : t.rich("overdue", bold)}
        </span>
      </div>

      {canManageBilling && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handlePayNow}
            disabled={payLink.isPending}
          >
            {payLink.isPending && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {t("payNow")}
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
          >
            <Link href="/dashboard/billing">{t("billing")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
