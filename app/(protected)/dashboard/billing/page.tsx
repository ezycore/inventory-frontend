"use client";
// coding-standard: maintained
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { BillingOverview } from "@/components/billing/billing-overview";
import { AvailablePlans } from "@/components/billing/available-plans";
import { CheckoutReturnHandler } from "@/components/billing/checkout-return-handler";
import { useCanManageBilling } from "@/hooks/use-has-permission";
import { useAuthStore } from "@/services/stores/use-auth-store";
import EmptyState from "@/ui/components/EmptyState";

export default function BillingPage() {
  const t = useTranslations("settings.billing");
  const tShell = useTranslations("settings.shell");
  const user = useAuthStore((state) => state.user);
  // The nav entry is permission-filtered, but the route is still reachable by
  // URL — and this page renders live subscribe/upgrade actions, so it gates
  // itself too.
  const canManageBilling = useCanManageBilling();

  // Denial renders in place rather than redirecting (the pattern used by
  // settings/roles). A canceled workspace is force-routed here by the protected
  // layout, so pushing the user elsewhere would bounce straight back and loop.
  if (user && !canManageBilling) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <EmptyState
          icon={ShieldAlert}
          title={tShell("noPermission")}
          description={t("noPermissionDescription")}
        />
      </div>
    );
  }

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
