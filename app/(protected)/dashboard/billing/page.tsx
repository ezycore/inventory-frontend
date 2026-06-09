import { Suspense } from "react";
import { BillingOverview } from "@/components/billing/billing-overview";
import { AvailablePlans } from "@/components/billing/available-plans";
import { CheckoutReturnHandler } from "@/components/billing/checkout-return-handler";

export default function BillingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <Suspense fallback={null}>
        <CheckoutReturnHandler />
      </Suspense>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          View your current plan, usage, and included features.
        </p>
      </div>
      <BillingOverview />
      <AvailablePlans />
    </div>
  );
}
