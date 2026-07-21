import {
  FeatureName,
  OrganizationFeatures,
  VatRegistrationEntry,
  VatRegistrationType,
} from "@/types";
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

type VatOrg = {
  features?: OrganizationFeatures;
  vatRegistrationHistory?: VatRegistrationEntry[];
};

/**
 * The registration in force on `date`. Mirrors the backend
 * `resolveVatRegistration` — keep the two in step.
 */
export function resolveVatRegistration(
  history: VatRegistrationEntry[] | undefined | null,
  date: Date = new Date()
): VatRegistrationType {
  if (!history?.length) return "unregistered";

  let current: VatRegistrationEntry | undefined;
  for (const entry of history) {
    const from = new Date(entry.effectiveFrom).getTime();
    if (from > date.getTime()) continue;
    if (!current || from >= new Date(current.effectiveFrom).getTime()) {
      current = entry;
    }
  }
  return current?.type ?? "unregistered";
}

/**
 * Single source of truth (FE) for "does this org put VAT on its invoices?".
 * Mirrors the backend `resolveOrgVat(...).chargesLineVat`.
 *
 * There is **no per-area toggle** any more: registration is a property of the
 * organization, so sales and purchases share one answer. It replaced
 * `isTaxActive(org, area)`, whose per-area sub-toggles treated a dated legal
 * status as a daily preference.
 *
 * `turnover_4` is deliberately **false** — a turnover taxpayer pays 4% of gross
 * turnover and issues invoices with no VAT line at all.
 */
export function isVatActive(org: VatOrg | undefined | null): boolean {
  if (!org?.features?.tax) return false;
  const type = vatRegistrationOf(org);
  return type === "standard_15" || type === "reduced";
}

/** May this org reclaim input VAT? Only a standard-rated registrant. */
export function claimsInputRebate(org: VatOrg | undefined | null): boolean {
  return Boolean(org?.features?.tax) && vatRegistrationOf(org) === "standard_15";
}

/**
 * The org's registration today, including the backend's temporary bridge: an org
 * with the feature ON and no declared history is treated as standard-rated.
 * Remove both sides together once setup forces the choice.
 */
export function vatRegistrationOf(
  org: VatOrg | undefined | null
): VatRegistrationType {
  const declared = resolveVatRegistration(org?.vatRegistrationHistory);
  if (
    declared === "unregistered" &&
    !org?.vatRegistrationHistory?.length &&
    org?.features?.tax
  ) {
    return "standard_15";
  }
  return declared;
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
  storefront: t("names.storefront"),
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
  storefront: t("descriptions.storefront"),
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
  storefront: "store",
  tax: "percent",
  combo: "package",
};
