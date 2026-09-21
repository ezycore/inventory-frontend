"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useGetStorefrontSettings, useStorefrontSite } from "@/services/api";
import type { StorefrontSettings } from "@/types";
import { settingsWithSiteLook } from "@/components/ecommerce/customize/site-look";

/**
 * The store's settings with the look shoppers see now — for admin screens that
 * report the look (the dashboard's look prompt, Themes, the collections hint)
 * rather than edit it.
 *
 * `GET /organization/storefront` is not enough on its own. Once a store publishes
 * its look through the Site (`siteCutoverAt`) the settings keep the look as it was
 * on the day it switched, and every store created since 2026-09-17 switches at
 * birth — so a screen reading the settings alone tells a new merchant their shop
 * still has "no theme" after they published one. This lays the Site's PUBLISHED
 * look over the settings, as the storefront itself does; Customize, which edits
 * the draft, merges it separately.
 *
 * `data` stays undefined until the Site has loaded for a switched store, so no
 * screen ever reports the stale copy while it waits — or when the Site fails.
 */
export function useLiveStoreSettings(): {
  data: StorefrontSettings | undefined;
  isLoading: boolean;
} {
  const { data: settings, isLoading: settingsLoading } = useGetStorefrontSettings();
  const switched = Boolean(settings?.siteCutoverAt);
  const { data: site, isError: siteFailed } = useStorefrontSite(switched);

  const data = useMemo(() => {
    if (!settings || !switched) return settings;
    return site ? settingsWithSiteLook(settings, site, "published") : undefined;
  }, [settings, switched, site]);

  return {
    data,
    isLoading: settingsLoading || (switched && !site && !siteFailed),
  };
}
