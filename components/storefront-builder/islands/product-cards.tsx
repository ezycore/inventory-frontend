"use client";
// coding-standard: maintained

import type { CatalogProduct } from "@/lib/storefront-client";
import type { CardMedia } from "@/lib/storefront-builder/card-media";
import { Grid } from "@/components/storefront/home/home-shared";

/**
 * Product cards for builder sections — the storefront's own `ProductCard` grid,
 * so a product on a landing page looks, links and buys exactly as it does on
 * the homepage. Loaded only through the island map.
 *
 * `imageFit` / `imageRatio` are the section's own card photo settings
 * (`sectionCardMedia`); unset, the cards follow Customize → Product cards.
 *
 * Needs the store context and the seeded store query above it, like every
 * `ProductCard`; the page frame provides both.
 */
export function ProductCardsIsland({
  products,
  currency,
  imageFit,
  imageRatio,
}: {
  products: CatalogProduct[];
  currency?: string;
} & CardMedia) {
  return <Grid products={products} currency={currency} imageFit={imageFit} imageRatio={imageRatio} />;
}
