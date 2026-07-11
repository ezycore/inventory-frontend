import { FeatureName, OrganizationFeatures, TaxSettings } from "@/types";
import type { Translator } from "@/i18n/config";

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(
  features: OrganizationFeatures | undefined,
  feature: FeatureName
): boolean {
  if (!features) return false;
  return features[feature] === true;
}

export type TaxArea = "sales" | "purchase";

/**
 * Single source of truth (FE) for "is tax active here?". Mirrors the backend
 * `isTaxActive`: gated by the master `tax` feature AND the per-area `taxSettings`
 * sub-toggle (sub-toggles default ON when unset). Returns follow their parent
 * area, so pass "sales" for sales + sales-returns, "purchase" for purchases +
 * purchase-returns.
 */
export function isTaxActive(
  org:
    | { features?: OrganizationFeatures; taxSettings?: TaxSettings }
    | undefined
    | null,
  area: TaxArea
): boolean {
  if (!org?.features?.tax) return false;
  if (area === "sales") return org.taxSettings?.salesEnabled !== false;
  return org.taxSettings?.purchaseEnabled !== false;
}

/**
 * Check if all specified features are enabled
 */
export function areAllFeaturesEnabled(
  features: OrganizationFeatures | undefined,
  requiredFeatures: FeatureName[],
): boolean {
  if (!features) return false;
  return requiredFeatures.every((feature) => features[feature] === true);
}

/**
 * Check if any of the specified features are enabled
 */
export function isAnyFeatureEnabled(
  features: OrganizationFeatures | undefined,
  allowedFeatures: FeatureName[],
): boolean {
  if (!features) return false;
  return allowedFeatures.some((feature) => features[feature] === true);
}

/**
 * Get list of enabled features
 */
export function getEnabledFeatures(
  features: OrganizationFeatures | undefined,
): FeatureName[] {
  if (!features) return [];
  return (Object.keys(features) as FeatureName[]).filter(
    (key) => features[key] === true,
  );
}

/**
 * Get list of disabled features
 */
export function getDisabledFeatures(
  features: OrganizationFeatures | undefined,
): FeatureName[] {
  if (!features) return [];
  return (Object.keys(features) as FeatureName[]).filter(
    (key) => features[key] === false,
  );
}

/**
 * Feature display names for UI. `t` is bound to `settings.features` by the caller.
 */
export const getFeatureDisplayNames = (t: Translator): Record<FeatureName, string> => ({
  sales: t("names.sales"),
  accounts: t("names.accounts"),
  expiryTracking: t("names.expiryTracking"),
  barcodeSystem: t("names.barcodeSystem"),
  invoicePrinting: t("names.invoicePrinting"),
  returns: t("names.returns"),
  uomConversion: t("names.uomConversion"),
  tax: t("names.tax"),
  combo: t("names.combo"),
});

/**
 * Feature descriptions for UI. `t` is bound to `settings.features` by the caller.
 */
export const getFeatureDescriptions = (t: Translator): Record<FeatureName, string> => ({
  sales: t("descriptions.sales"),
  accounts: t("descriptions.accounts"),
  expiryTracking: t("descriptions.expiryTracking"),
  barcodeSystem: t("descriptions.barcodeSystem"),
  invoicePrinting: t("descriptions.invoicePrinting"),
  returns: t("descriptions.returns"),
  uomConversion: t("descriptions.uomConversion"),
  tax: t("descriptions.tax"),
  combo: t("descriptions.combo"),
});

/**
 * Feature icons for UI (lucide icon names)
 */
export const FEATURE_ICONS: Record<FeatureName, string> = {
  sales: "shopping-cart",
  accounts: "wallet",
  expiryTracking: "calendar-clock",
  barcodeSystem: "scan-barcode",
  invoicePrinting: "printer",
  returns: "undo-2",
  uomConversion: "repeat",
  tax: "percent",
  combo: "package",
};
