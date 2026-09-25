"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useLiveStoreSettings } from "@/components/ecommerce/use-live-store-settings";
import type { StoreFacts } from "./section-defaults";

/**
 * What `defaultsForStore` reads, from the look shoppers see now — the Site's
 * published promises on a switched store, not the settings' frozen copy. Held
 * by value so an unchanged answer keeps its identity across renders. Until it
 * loads it answers "no promises", the defaults every band had before.
 */
export function useStoreFacts(): StoreFacts {
  const { data: settings } = useLiveStoreSettings();
  const hasPromises = !!settings?.trustBadges?.some((badge) => badge.text?.trim());
  return useMemo(() => ({ hasPromises }), [hasPromises]);
}
