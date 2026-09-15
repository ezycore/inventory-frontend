"use client";
// coding-standard: maintained

import { useParams } from "next/navigation";
import {
  useStoreCategories,
  useStoreProduct,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { useProductBuy } from "@/components/storefront/product-detail/use-product-buy";
import type { CatalogProduct } from "@/lib/storefront-client";

/**
 * Everything the product page knows and can do — its queries, the product
 * template, and buying (`useProductBuy`, shared with a landing page's Single
 * product section).
 *
 * Split out of the page component so the page is composition and this is
 * behaviour. The split point is deliberate: **every hook lives here**, so the
 * page's loading/error early-returns can never make a hook call conditional —
 * the trap the old file carried two comments about.
 */
export function useProductDetail(initialProduct?: CatalogProduct) {
  const { slug } = useStoreContext();
  const productSlug = String(useParams().productSlug);

  // Seeded by shop/layout.tsx through the shell, so the breadcrumb's category
  // rungs are in the SSR HTML. That seeding was added because of this line: the
  // query had no `initialData` at all, so the visible trail server-rendered as
  // "Store › All products › Product" while the page's JSON-LD — built server-side
  // from the same helper — already carried the real category trail. Two claims,
  // one page, disagreeing until hydration.
  const { data: categories } = useStoreCategories(slug);
  const {
    data: product,
    isLoading,
    isError,
  } = useStoreProduct(slug, productSlug, initialProduct);
  // Related picks: same category when the product has one, latest otherwise.
  const { data: relatedData } = useStoreProducts(
    slug,
    product?.categoryId ? { categoryId: product.categoryId, limit: 8 } : { limit: 8 },
  );

  // The component survives PDP→PDP navigation (related products), so the
  // shopper's picks reset per product slug.
  const buy = useProductBuy(product, productSlug);
  const variant = useStoreTemplate(buy.store, "product");

  return {
    ...buy,
    productSlug,
    categories,
    isLoading,
    isError,
    /** Gallery above the info column on every layout except "gallery left". */
    galleryTop: variant !== "left",
    /** The "sticky bar" layout — <ProductStickyBar> measures its own height. */
    sticky: variant === "sticky",
    related: (relatedData?.items ?? []).filter((p) => p.slug !== product?.slug).slice(0, 4),
  };
}

export type ProductDetail = ReturnType<typeof useProductDetail>;
