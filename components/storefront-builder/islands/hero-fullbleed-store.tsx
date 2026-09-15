"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import {
  HeroFullBleedView,
  type HeroFullBleedFallback,
} from "@/components/storefront/home/hero-fullbleed";

/**
 * A full-width builder hero drawn as the classic home's banner hero: the store
 * banner and the first slide's copy, with "Start shopping" in the shopper's
 * language when the slide has no button label and the hero keeps the store's
 * wording. Loaded only through the island map.
 */
export function HeroFullBleedStoreIsland({
  base,
  storeName,
  storeWords,
  fallback,
}: {
  base: string;
  storeName: string;
  storeWords: boolean;
  fallback: HeroFullBleedFallback;
}) {
  const { t } = useStorefrontUI();
  const ctaLabel = fallback.ctaLabel || (storeWords ? t.startShopping : undefined);
  return <HeroFullBleedView base={base} slides={[]} storeName={storeName} fallback={{ ...fallback, ctaLabel }} />;
}
