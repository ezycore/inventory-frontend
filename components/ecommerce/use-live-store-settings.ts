"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useGetStorefrontSettings, useStorefrontSite } from "@/services/api";
import type { StorefrontWithLook } from "@/types";
import { settingsWithSiteLook } from "@/components/ecommerce/customize/site-look";

/**
 * The store's settings with the look shoppers see now — for admin screens that
 * report the look (the dashboard's look prompt, Themes, the collections hint)
 * rather than edit it. The look lives on the Site, so this lays its PUBLISHED
 * look over the settings, as the storefront itself does; Customize, which edits
 * the draft, merges it separately.
 *
 * `data` stays undefined until both have loaded, so no screen reports a store
 * with no look while it waits — or when the Site fails.
 */
export function useLiveStoreSettings(): {
  data: StorefrontWithLook | undefined;
  isLoading: boolean;
} {
  const { data: settings, isLoading: settingsLoading } = useGetStorefrontSettings();
  const { data: site, isLoading: siteLoading } = useStorefrontSite();

  const data = useMemo(
    () => (settings && site ? settingsWithSiteLook(settings, site, "published") : undefined),
    [settings, site],
  );

  return { data, isLoading: settingsLoading || siteLoading };
}
