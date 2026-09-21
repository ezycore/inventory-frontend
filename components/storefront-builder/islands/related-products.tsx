"use client";
// coding-standard: maintained

import type { CatalogProduct } from "@/lib/storefront-client";
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
  limit,
  currency,
}: {
  product: Pick<CatalogProduct, "slug" | "categoryId">;
  heading?: string;
  limit?: number;
  currency?: string;
}) {
  const { t } = useStorefrontUI();
  const related = useRelatedProducts(product, limit);
  if (related.length === 0) return null;
  return (
    <div>
      <SectionTitle>{heading || t.relatedTitle}</SectionTitle>
      <div className="sf-grid-4">
        {related.map((p) => (
          <ProductCard key={p._id} product={p} currency={currency} variant="compact" />
        ))}
      </div>
    </div>
  );
}
