"use client";
// coding-standard: maintained

import type { ComponentType } from "react";
import {
  getHomeTemplateMeta,
  type HomeTemplateMeta,
} from "@/lib/storefront-home-templates";
import type { SectionProps } from "@/components/storefront/home/home-shared";
import {
  CardHero,
  ManifestoHero,
  SplitHero,
} from "@/components/storefront/home/sections/hero-section";
import {
  CategoryChips,
  CategoryStrip,
} from "@/components/storefront/home/sections/categories-section";
import {
  FeaturedCompact,
  FeaturedGrid,
  FeaturedSelected,
} from "@/components/storefront/home/sections/featured-section";
import {
  DealsRail,
  DepartmentGrid,
  SuperstoreHero,
  SuperstoreLatest,
  TrustStrip,
} from "@/components/storefront/home/sections/superstore-blocks";
import { LatestSection } from "@/components/storefront/home/sections/latest-section";
import { TrustSection } from "@/components/storefront/home/sections/trust-section";
import { PromoSection } from "@/components/storefront/home/sections/promo-section";

/**
 * Which component draws each block, per template.
 *
 * This replaced a dispatcher that branched on a variant string inside every
 * section component: with three looks that was three `if`s per block, and a
 * fourth design would have made it four, in six files, with no design
 * changeable without reading the other three. Here a template names the block
 * it wants, blocks are shared only where they genuinely are the same thing,
 * and a new template cannot alter an existing one.
 *
 * The order and the capability list are data (`lib/storefront-home-templates`)
 * so the admin editor can read them without importing any of this.
 */
type SectionMap = Record<string, ComponentType<SectionProps>>;

const SECTIONS: Record<string, SectionMap> = {
  classic: {
    hero: CardHero,
    categories: CategoryChips,
    featured: FeaturedGrid,
    latest: LatestSection,
    trust: TrustSection,
    promo: PromoSection,
  },
  "hero-split": {
    hero: SplitHero,
    categories: CategoryChips,
    featured: FeaturedCompact,
    latest: LatestSection,
    trust: TrustSection,
    promo: PromoSection,
  },
  superstore: {
    hero: SuperstoreHero,
    trust: TrustStrip,
    deals: DealsRail,
    categories: DepartmentGrid,
    featured: FeaturedGrid,
    latest: SuperstoreLatest,
  },
  minimal: {
    hero: ManifestoHero,
    categories: CategoryStrip,
    featured: FeaturedSelected,
    trust: TrustSection,
  },
};

export interface HomeTemplate extends HomeTemplateMeta {
  sections: SectionMap;
}

/** Falls back to Classic — the look every store had before templates existed. */
export function getHomeTemplate(id?: string): HomeTemplate {
  const meta = getHomeTemplateMeta(id);
  return { ...meta, sections: SECTIONS[meta.id] ?? SECTIONS.classic };
}
