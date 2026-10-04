"use client";
// coding-standard: maintained

import { createContext, useContext, type ReactNode } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import {
  ProductPageView,
  type ProductShape,
} from "@/components/storefront/product/product-page";
import type { ProductPart } from "@/lib/storefront-builder/product-parts";

/**
 * The product a product route resolved on the server, so the page's content is
 * in the HTML rather than fetched after paint.
 *
 * Held in a context for the same reason the collection's is: a product page can
 * be a builder page, and then its core section draws the product — but a section
 * knows nothing about `[productSlug]`. The route fetches, the section renders.
 */
const ProductDataContext = createContext<{ initialProduct?: CatalogProduct }>({});

export function ProductDataProvider({
  value,
  children,
}: {
  value: { initialProduct?: CatalogProduct };
  children: ReactNode;
}) {
  return <ProductDataContext.Provider value={value}>{children}</ProductDataContext.Provider>;
}

/** The product, drawn from whatever the route resolved. Used by the core section. */
export function ProductFromRoute({
  hideRelated,
  hideDescription,
  layout,
  shape,
  parts,
  promises,
}: {
  hideRelated?: boolean;
  hideDescription?: boolean;
  layout?: string;
  /** The section's photo and related-row settings, already resolved to CSS values. */
  shape?: ProductShape;
  /** The column beside the photos, in the section's order; unset is the column as it always was. */
  parts?: readonly ProductPart[];
  /** The store's promises, for a promises part. */
  promises?: readonly { text: string; icon?: string }[];
}) {
  const { initialProduct } = useContext(ProductDataContext);
  return (
    <ProductPageView
      initialProduct={initialProduct}
      hideRelated={hideRelated}
      hideDescription={hideDescription}
      layout={layout}
      shape={shape}
      parts={parts}
      promises={promises}
    />
  );
}
