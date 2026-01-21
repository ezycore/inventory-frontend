import { useMemo } from "react";
import { navItems } from "@/constants/navItem";
import { filterNavItems } from "@/lib/nav-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSettingsStore } from "@/stores/use-settings-store";

/**
 * Hook to get filtered navigation items based on user role, permissions, and features
 * Memoized for performance
 */
export function useFilteredNavItems() {
  const user = useAuthStore((state) => state.user);
  const features = useSettingsStore((state) => state.features);

  const filteredItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return filterNavItems(
      navItems,
      user.role,
      user.permissions || [],
      features
    );
  }, [user, features]);

  return filteredItems;
}

/**
 * Hook to check if a specific feature is enabled
 * For use in components that need conditional rendering
 */
export function useFeatureCheck() {
  const features = useSettingsStore((state) => state.features);
  const isFeatureEnabled = useSettingsStore((state) => state.isFeatureEnabled);

  return {
    features,
    isFeatureEnabled,
    isSalesEnabled: features.sales,
    isAccountsEnabled: features.accounts,
    isExpiryTrackingEnabled: features.expiryTracking,
    isBarcodeSystemEnabled: features.barcodeSystem,
    isInvoicePrintingEnabled: features.invoicePrinting,
    isReturnsEnabled: features.returns,
  };
}
