"use client";
// coding-standard: maintained

import type { FC } from "react";
import type { SectionProps } from "@/components/storefront/home/home-shared";
import {
  HeroCard,
  HeroOpen,
  HeroFullBleed,
  HeroManifesto,
  HeroSplit,
  SearchHero,
} from "@/components/storefront/home/sections/hero-sections";
import {
  CategoryChips,
  CategoryLinks,
  CategoryTiles,
} from "@/components/storefront/home/sections/category-sections";
import {
  FeaturedGrid,
  LatestGrid,
  MinimalPicks,
  PicksGrid,
  ProductRail,
} from "@/components/storefront/home/sections/product-sections";
import {
  DealStrip,
  EditorialSplit,
  PromoTiles,
  TrustBand,
  TrustRow,
} from "@/components/storefront/home/sections/band-sections";

/**
 * The homepage section registry — the id → component map that makes a storefront
 * homepage **a list the merchant owns** rather than one of three hardcoded pages.
 *
 * Why this exists: until 2026-08-12 the homepage was three components
 * (`home-classic` / `home-hero-split` / `home-minimal`), each hardcoding its own
 * sequence of the same five ingredients. A theme could pick one of the three and
 * repaint it, which is why three "completely different" themes still read as the
 * same website. `theme.homepageSections` was modelled on the backend and consumed
 * nowhere.
 *
 * **The rule this file exists to enforce: to make shops look more different, add
 * a SECTION here — never a branch inside a component and never a per-theme
 * component.** A section is shared code any theme may compose, so a fix lands
 * once; a per-theme component multiplies every future feature by the number of
 * themes, which is the trap this whole design avoids.
 *
 * Sections take one prop shape (`SectionProps`) and every one of them renders
 * `null` when its own data is missing — a reordered page must never grow holes.
 */

export const SECTION_COMPONENTS = {
  // Heroes — a page uses one.
  "hero-card": HeroCard,
  // Frameless — the copy sits on the page itself. The only hero that lets a
  // themed ground be seen on the first screen.
  "hero-open": HeroOpen,
  "hero-split": HeroSplit,
  "hero-manifesto": HeroManifesto,
  "hero-fullbleed": HeroFullBleed,
  "search-hero": SearchHero,
  // Ways into the catalogue.
  "category-chips": CategoryChips,
  "category-links": CategoryLinks,
  "category-tiles": CategoryTiles,
  // Product rows.
  "featured-grid": FeaturedGrid,
  "latest-grid": LatestGrid,
  "picks-grid": PicksGrid,
  "product-rail": ProductRail,
  "minimal-picks": MinimalPicks,
  // Full-width bands.
  "trust-row": TrustRow,
  "trust-band": TrustBand,
  "promo-tiles": PromoTiles,
  "deal-strip": DealStrip,
  "editorial-split": EditorialSplit,
} satisfies Record<string, FC<SectionProps>>;

export type SectionId = keyof typeof SECTION_COMPONENTS;

export const SECTION_IDS = Object.keys(SECTION_COMPONENTS) as SectionId[];

export const isSectionId = (value: unknown): value is SectionId =>
  typeof value === "string" && Object.hasOwn(SECTION_COMPONENTS, value);

/**
 * The section list each legacy `templates.home` value produces.
 *
 * These three reproduce the pre-registry pages exactly, so a store that has
 * never opened Themes renders as it always did. `templates.home` therefore
 * survives as "which default composition", not as a component switch — and a
 * merchant who reorders sections simply stops using the default.
 */
export const HOME_PRESET_SECTIONS: Record<string, SectionId[]> = {
  classic: ["hero-card", "category-chips", "featured-grid", "latest-grid"],
  "hero-split": ["hero-split", "trust-row", "picks-grid", "promo-tiles"],
  minimal: ["hero-manifesto", "category-links", "minimal-picks"],
};

/** Merchant-facing names for the Customize → Sections editor. */
export const SECTION_LABELS: Record<SectionId, string> = {
  "hero-card": "Hero card",
  "hero-open": "Open hero (no card)",
  "hero-split": "Split hero",
  "hero-manifesto": "Centred statement",
  "hero-fullbleed": "Full-width photo hero",
  "search-hero": "Search bar hero",
  "category-chips": "Category chips",
  "category-links": "Category links",
  "category-tiles": "Category photo tiles",
  "featured-grid": "Featured products",
  "latest-grid": "New arrivals",
  "picks-grid": "Weekly picks",
  "product-rail": "Product rail (side-scroll)",
  "minimal-picks": "Selected products",
  "trust-row": "Promise cards",
  "trust-band": "Your promises band",
  "promo-tiles": "Promo tiles",
  "deal-strip": "Live campaign strip",
  "editorial-split": "Editorial split",
};
