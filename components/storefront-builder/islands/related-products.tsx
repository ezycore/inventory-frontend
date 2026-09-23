"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import type { CardMedia } from "@/lib/storefront-builder/card-media";
import { responsiveClasses, responsiveVars } from "@/lib/storefront-builder/responsive";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { useRelatedProducts } from "@/components/storefront/product-detail/use-product-detail";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/**
 * The Related products section's row: the product page's own "You may also
 * like" query and cards (`useRelatedProducts`), under the merchant's heading or
 * else the store's words for it. Fetched in the browser, as the built-in row
 * is, so moving the row into a section changes where it sits and nothing else.
 * Loaded only through the island map.
 */
export function RelatedProductsIsland({
  product,
  heading,
  subheading,
  limit,
  columns,
  imageFit,
  imageRatio,
  currency,
}: {
  product: Pick<CatalogProduct, "slug" | "categoryId">;
  heading?: string;
  subheading?: string;
  limit?: number;
  /** `{ base, mobile }` — the same shape every other responsive setting stores. */
  columns?: { base?: number; mobile?: number };
  currency?: string;
} & CardMedia) {
  const { t } = useStorefrontUI();
  const related = useRelatedProducts(product, limit);
  if (related.length === 0) return null;
  return (
    <div>
      <SectionTitle subheading={subheading}>{heading || t.relatedTitle}</SectionTitle>
      {/* ⚠ These props stop nowhere else: a setting that reaches the section
          renderer and not its island is a control that silently does nothing,
          which is the miss this row had for every other product row's settings
          — no columns, no card photo shape. */}
      {/* ⚠ `sf-grid-4` stays on, always. It was swapped OUT for the column
          class, and `.sfb-cols` only redefines a variable — it declares no
          `display: grid` — so a merchant who set a column count got a row with
          no grid at all and cards stacked one per line. The column classes are
          an override of the count, never a replacement for the grid. */}
      <div
        className={gridClass(columns)}
        style={columns ? (responsiveVars("sfb-cols", columns) as CSSProperties) : undefined}
      >
        {related.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            currency={currency}
            variant="compact"
            imageFit={imageFit}
            imageRatio={imageRatio}
          />
        ))}
      </div>
    </div>
  );
}

/** The storefront's product grid, plus the column override for each screen that has one. */
function gridClass(columns?: { base?: number; mobile?: number }): string {
  const own = responsiveClasses("sfb-cols", columns);
  return own ? `sf-grid-4 ${own}` : "sf-grid-4";
}
