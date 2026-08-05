// coding-standard: maintained

import type { ComponentType } from "react";
import type { HomeSectionId } from "@/lib/storefront-home-sections";
import type { SectionProps } from "@/components/storefront/home/home-shared";
import { HeroSection } from "@/components/storefront/home/sections/hero-section";
import { CategoriesSection } from "@/components/storefront/home/sections/categories-section";
import { FeaturedSection } from "@/components/storefront/home/sections/featured-section";
import { LatestSection } from "@/components/storefront/home/sections/latest-section";
import { TrustSection } from "@/components/storefront/home/sections/trust-section";
import { PromoSection } from "@/components/storefront/home/sections/promo-section";

/**
 * The id → component half of the homepage section model. The ids, the per-look
 * default orders and `resolveHomeSections` live in
 * `lib/storefront-home-sections.ts` — deliberately apart from this file, so the
 * admin Customize editor can resolve an order without importing six storefront
 * components into its bundle.
 */
export const HOME_SECTION_COMPONENTS: Record<
  HomeSectionId,
  ComponentType<SectionProps>
> = {
  hero: HeroSection,
  categories: CategoriesSection,
  featured: FeaturedSection,
  latest: LatestSection,
  trust: TrustSection,
  promo: PromoSection,
};
