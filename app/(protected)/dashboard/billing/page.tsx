"use client";
// coding-standard: maintained
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { BillingOverview } from "@/components/billing/billing-overview";
import { AvailablePlans } from "@/components/billing/available-plans";
import { CheckoutReturnHandler } from "@/components/billing/checkout-return-handler";

export default function BillingPage() {
  const t = useTranslations("settings.billing");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <Suspense fallback={null}>
        <CheckoutReturnHandler />
      </Suspense>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <BillingOverview />
      <AvailablePlans />
    </div>
  );
}
