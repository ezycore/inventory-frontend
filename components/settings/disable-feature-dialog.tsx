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
  /**
   * Capabilities that switch off WITH this one, already resolved to display
   * names. A row count says what data is affected; this says what other
   * switches move, which for a parent capability is the larger surprise —
   * turning stock off also takes Purchases, Suppliers, Expiry tracking, Bundles
   * and unit conversion, and a merchant who is not told that discovers it by
   * finding five menus gone.
   */
  cascaded: string[] = [],
): string | null {
  if (!impact) return null;

  // A cascade is worth saying out loud even when nothing is at stake data-wise
  // — it is the only warning for a change with no row count behind it. And it
  // can promise the return honestly: the cascade is DERIVED inside
  // `computeEffectiveFeatures` and never written to `featureOverrides`, so
  // switching the parent back on restores each dependant to exactly the state
  // the merchant last chose.
  const cascadeLine =
    cascaded.length > 0
      ? t("disable.cascade", { features: cascaded.join(", ") })
      : null;
  const withCascade = (line: string | null) =>
    [line, cascadeLine].filter(Boolean).join(" ") || null;

  switch (feature) {
    case "inventoryTracking":
      // No row count of its own: stock rows are not deleted, they stop being
      // read. The cascade IS the consequence here.
      return withCascade(t("disable.inventoryTracking"));
    case "storefront": {
      const n = impact.storefront.pendingOnlineOrders;
      // The one that genuinely bites: the public shop goes offline, and orders
      // already in the queue stop being visible to anyone.
      return withCascade(t("disable.storefront", { count: n }));
    }
    case "expiryTracking": {
      const n = impact.expiryTracking.trackedBatches;
      return withCascade(n > 0 ? t("disable.expiryTracking", { count: n }) : null);
    }
    case "multiLocation": {
      const n = impact.multiLocation.locations;
      return withCascade(n > 1 ? t("disable.multiLocation", { count: n }) : null);
    }
    case "returns": {
      // Both kinds: this feature gates the purchase-return routes as well as
      // the sales ones, so a merchant whose returns are all supplier-side used
      // to be told nothing would change.
      const n = impact.returns.salesReturns + impact.returns.purchaseReturns;
      return withCascade(n > 0 ? t("disable.returns", { count: n }) : null);
    }
    default:
      return cascadeLine;
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
