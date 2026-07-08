// coding-standard: maintained
"use client";

import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetSubscription, useRequestPayLink } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatCurrency } from "@/lib/currency";
import { isPaymentOverdue } from "@/lib/subscription-utils";
import { Button } from "@/ui/components/button";

/**
 * App-wide banner shown when the subscription payment is overdue (past_due /
 * grace / read-only). "Pay now" fetches a live pay link on demand from Mission
 * Control (SSLCommerz session for SSL plans, Stripe hosted invoice for card) and
 * redirects — no hunting through the emailed link. Rendered in the protected
 * layout alongside the demo banner; hidden for healthy subscriptions.
 */
export function BillingAlertBanner() {
  const subscription = useGetSubscription();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const payLink = useRequestPayLink();

  const entitlement = subscription.data?.entitlement;
  if (!entitlement || !isPaymentOverdue(entitlement)) return null;

  const amount =
    entitlement.amount != null
      ? formatCurrency(entitlement.amount, currency)
      : null;

  const handlePayNow = () => {
    payLink.mutate(undefined, {
      onSuccess: (res) => {
        const url = res.data?.url;
        if (url) {
          window.location.href = url;
          return;
        }
        // Nothing due (already settled / manual plan) — refresh so the banner
        // clears once the mirror catches up.
        toast.info("No outstanding payment was found.");
        subscription.refetch();
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-destructive dark:bg-destructive/20">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Your subscription payment{amount ? <> of <strong>{amount}</strong></> : null} is{" "}
          <strong>overdue</strong>. Pay now to keep full access — unpaid
          workspaces become read-only, then suspended.
        </span>
      </div>

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
          Pay now
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
        >
          <Link href="/dashboard/billing">Billing</Link>
        </Button>
      </div>
    </div>
  );
}
