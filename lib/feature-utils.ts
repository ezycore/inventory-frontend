import { FeatureName, OrganizationFeatures, TaxSettings } from "@/types";

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
 * Feature display names for UI
 */
export const FEATURE_DISPLAY_NAMES: Record<FeatureName, string> = {
  sales: "Sales Management",
  accounts: "Account Management",
  expiryTracking: "Expiry Tracking",
  barcodeSystem: "Barcode System",
  invoicePrinting: "Invoice Printing",
  returns: "Returns Management",
  uomConversion: "Unit Conversion",
  storefront: "Ecommerce Storefront",
  tax: "Tax Management",
};

/**
 * Feature descriptions for UI
 */
export const FEATURE_DESCRIPTIONS: Record<FeatureName, string> = {
  sales: "Enable sales orders, customer invoices, and sales history tracking",
  accounts:
    "Enable account management, payment tracking, and financial records",
  expiryTracking: "Track product expiry dates with batch management and alerts",
  barcodeSystem: "Enable barcode scanning and barcode-based product lookup",
  invoicePrinting: "Generate and print invoices for sales and purchases",
  returns: "Enable sales returns, purchase returns, and credit management",
  uomConversion: "Enable unit of measure conversion for products",
  storefront: "Enable a public online store with shopper accounts, online orders, and courier delivery",
  tax: "Enable tax rates and apply tax on purchases and sales",
};

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
};
