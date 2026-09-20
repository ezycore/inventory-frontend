"use client";
// coding-standard: maintained

import type { StoreHeroSlide } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import {
  HeroFullBleedView,
  type HeroFullBleedFallback,
} from "@/components/storefront/home/hero-fullbleed";

/**
 * A full-width builder hero drawn as the classic home's banner hero: the store
 * banner behind the merchant's slides, with the store's own wording where a
 * slide supplies none. Loaded only through the island map.
 *
 * **It passes the slides on, and that is the whole point of this module.** It
 * used to hand `HeroFullBleedView` an empty list and one flattened `fallback`
 * built from slide 1, so a merchant who added five slides was told "5 of 5" in
 * the editor and shown one photograph that never moved. The view has rotated
 * slides since 2026-08-29 and fills an artwork-less slide from `fallback` by
 * itself, which is exactly what "Use the store banner" promises — so the
 * slides go straight through and `fallback` now carries the banner alone.
 *
 * The two things the view cannot know are resolved here, because both need the
 * shopper's language and the store's name:
 * - a first slide with no headline shows the **store's name**, as the classic
 *   banner hero did;
 * - a slide with no button label takes the store's own word for it when the
 *   merchant kept the store's wording.
 */
export function HeroFullBleedStoreIsland({
  base,
  storeName,
  storeWords,
  align,
  slides,
  fallback,
}: {
  base: string;
  storeName: string;
  storeWords: boolean;
  align?: "left" | "center";
  slides: StoreHeroSlide[];
  /** The store banner and how to crop it — no copy; the slides carry that. */
  fallback: HeroFullBleedFallback;
}) {
  const { t } = useStorefrontUI();
  const shown = slides.map((slide, i) => ({
    ...slide,
    /* The first slide only. The banner hero stands in for the shop, so its
       opening frame wears the shop's name where the merchant typed none — but
       a later slide repeating it reads as a carousel that has stopped. */
    title: slide.title?.trim() || (i === 0 ? storeName : undefined),
    buttonLabel: slide.buttonLabel?.trim() || (storeWords ? t.startShopping : undefined),
  }));
  return (
    <HeroFullBleedView base={base} slides={shown} storeName={storeName} fallback={fallback} align={align} />
  );
}
