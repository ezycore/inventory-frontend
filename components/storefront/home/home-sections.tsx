"use client";
// coding-standard: maintained

import type { FC } from "react";
import type { SectionProps } from "@/components/storefront/home/home-shared";
import type { SectionId } from "@/lib/storefront-section-ids";
import {
  HeroCard,
  HeroOpen,
  HeroFullBleed,
} from "@/components/storefront/home/sections/hero-sections";
import {
  TagChips,
  CategoryChips,
  CategoryTiles,
} from "@/components/storefront/home/sections/category-sections";
import {
  MinimalPicks,
  ProductGrid,
  ProductRail,
} from "@/components/storefront/home/sections/product-sections";
import {
  DealStrip,
  EditorialSplit,
  TrustBand,
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
 *
 * **The ids, labels and presets live in `lib/storefront-section-ids.ts`, not
 * here.** This module is `"use client"` (it imports components), and the
 * homepage's SERVER render needs the vocabulary to decide what to fetch before
 * it renders anything — importing it from here throws "Attempted to call
 * isSectionId() from the server". The `satisfies Record<SectionId, …>` below is
 * what stops the two drifting: an id with no component, or a component with no
 * id, is a type error rather than a blank homepage.
 */

export const SECTION_COMPONENTS = {
  // Heroes — a page uses one, and the three answer one question each: how
  // framed. See the family note in `hero-sections.tsx`.
  "hero-card": HeroCard,
  // Frameless — the copy sits on the page itself. The only hero that lets a
  // themed ground be seen on the first screen, and the one that reads
  // `theme.heroAlign`.
  "hero-open": HeroOpen,
  "hero-fullbleed": HeroFullBleed,
  // Ways into the catalogue. The chips row draws itself as picture tiles or as
  // plain names — `homeCollections.style`, not a second section.
  "category-chips": CategoryChips,
  "category-tiles": CategoryTiles,
  "tag-chips": TagChips,
  // Product rows. One grid, pointed by its `sectionConfig.source` — the id is
  // kept as `featured-grid` because 28 stored documents already name it.
  "featured-grid": ProductGrid,
  "product-rail": ProductRail,
  "minimal-picks": MinimalPicks,
  // Full-width bands.
  "trust-band": TrustBand,
  "deal-strip": DealStrip,
  "editorial-split": EditorialSplit,
} satisfies Record<SectionId, FC<SectionProps>>;
