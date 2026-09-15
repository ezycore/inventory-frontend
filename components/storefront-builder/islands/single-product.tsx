"use client";
// coding-standard: maintained

import type { CatalogProduct } from "@/lib/storefront-client";
import { useStoreProduct } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useCartUI } from "@/services/stores/use-cart-ui-store";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { useProductBuy } from "@/components/storefront/product-detail/use-product-buy";
import {
  ProductLongDescription,
  ProductOverview,
} from "@/components/storefront/product-detail/product-overview";

/**
 * A landing page's Single product section: the product page's own photos,
 * options, price and buy controls (`ProductOverview`, `useProductBuy`), so a
 * product sells the same on both. Loaded only through the island map.
 *
 * Two differences, both because a landing page is not the product page:
 *  - **Add to cart opens the cart drawer** instead of a toast. A landing page
 *    often has no store header, so a toast would leave the shopper with nowhere
 *    visible to go next.
 *  - **The photo layout is the section's own** when the merchant set one;
 *    unset, it follows Customize → Product page like the product page does.
 */
export function SingleProductIsland({
  product: listed,
  galleryLayout,
  hideDescription = false,
}: {
  product: CatalogProduct;
  galleryLayout?: "gallery-left" | "gallery-top";
  hideDescription?: boolean;
}) {
  const { slug } = useStoreContext();
  // The list row the section was drawn with carries no variants; a variable
  // product waits for the detail payload before it can offer a choice.
  const variable = listed.productType === "variable";
  const { data: detail } = useStoreProduct(slug, variable ? listed.slug : "");
  const buy = useProductBuy(detail ?? listed, listed._id);
  const openCart = useCartUI((s) => s.openCart);
  const template = useStoreTemplate(buy.store, "product");
  const galleryTop = galleryLayout ? galleryLayout === "gallery-top" : template !== "left";

  const d = {
    ...buy,
    add: (notify = true) => {
      const added = buy.add(false);
      if (added && notify) openCart();
      return added;
    },
  };

  return (
    <>
      <ProductOverview
        d={d}
        galleryTop={galleryTop}
        heading="h2"
        showDescription={!hideDescription}
        pending={variable && !detail}
      />
      {hideDescription ? null : <ProductLongDescription d={d} />}
    </>
  );
}
