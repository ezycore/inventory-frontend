"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import type { FeatureName } from "@/types";
import type { FeatureImpact } from "@/services/api/modules/organization/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";

/**
 * The consequence line for switching a feature off, when there is one.
 *
 * Only features with something at stake produce a line — a generic "are you
 * sure?" on every toggle trains people to click through the one that matters.
 * Returns null when the count is zero or the feature carries no risk, and the
 * caller then disables without asking.
 */
export function disableConsequence(
  feature: FeatureName,
  impact: FeatureImpact | undefined,
  t: ReturnType<typeof useTranslations>,
): string | null {
  if (!impact) return null;

  switch (feature) {
    case "storefront": {
      const n = impact.storefront.pendingOnlineOrders;
      // The one that genuinely bites: the public shop goes offline, and orders
      // already in the queue stop being visible to anyone.
      return t("disable.storefront", { count: n });
    }
    case "expiryTracking": {
      const n = impact.expiryTracking.trackedBatches;
      return n > 0 ? t("disable.expiryTracking", { count: n }) : null;
    }
    case "multiLocation": {
      const n = impact.multiLocation.locations;
      return n > 1 ? t("disable.multiLocation", { count: n }) : null;
    }
    case "returns": {
      const n = impact.returns.salesReturns;
      return n > 0 ? t("disable.returns", { count: n }) : null;
    }
    default:
      return null;
  }
}

export function DisableFeatureDialog({
  featureName,
  consequence,
  open,
  onOpenChange,
  onConfirm,
}: {
  featureName: string;
  consequence: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("settings.features");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("disable.title", { feature: featureName })}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {consequence && <span className="block">{consequence}</span>}
            {/* Stated every time, because "hidden" reads as "deleted" to most
                people and the difference is the whole reassurance. */}
            <span className="block">{t("disable.dataSafe")}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("disable.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("disable.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
