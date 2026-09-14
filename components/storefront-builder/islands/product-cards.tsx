"use client";
// coding-standard: maintained

import type { CatalogProduct } from "@/lib/storefront-client";
import { Grid } from "@/components/storefront/home/home-shared";

/**
 * Product cards for builder sections — the storefront's own `ProductCard` grid,
 * so a product on a landing page looks, links and buys exactly as it does on
 * the homepage. Loaded only through the island map.
 *
 * Needs the store context and the seeded store query above it, like every
 * `ProductCard`; the page frame provides both.
 */
export function ProductCardsIsland({
  products,
  currency,
}: {
  products: CatalogProduct[];
  currency?: string;
}) {
  return <Grid products={products} currency={currency} />;
}
