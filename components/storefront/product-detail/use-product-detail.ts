"use client";
// coding-standard: maintained

import { useParams } from "next/navigation";
import {
  useStoreCategories,
  useStoreProduct,
  useStoreRelated,
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
export function useProductDetail(
  initialProduct?: CatalogProduct,
  /**
   * The `product-main` core section's own layout, once the product page is on
   * the builder — a raw `templates.product` id, unset on every page the
   * migration builds.
   */
  layout?: string,
  /** That section's own related-row count; unset keeps the built-in four. */
  relatedLimit?: number,
) {
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
  const related = useRelatedProducts(product, relatedLimit);

  // The component survives PDP→PDP navigation (related products), so the
  // shopper's picks reset per product slug.
  const buy = useProductBuy(product, productSlug);
  const variant = useStoreTemplate(buy.store, "product", layout);

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
    related,
  };
}

/**
 * The product page's "You may also like" row, and the Related products section that can take its
 * place (plan §17, Phase 6 step 5). The backend decides the order — the merchant's picks, then the
 * same sub-category, shared tags, the same category
 * (docs/plan/related-products-and-stock-left.md §A3) — so this only asks for `limit` rows. One
 * query for both, so a page drawing the section beside a hidden row asks once.
 */
export function useRelatedProducts(
  product: Pick<CatalogProduct, "slug"> | undefined,
  /** `undefined` rather than a caller's own default, so an unset section setting lands here. */
  limit?: number,
): CatalogProduct[] {
  const { slug } = useStoreContext();
  const { data } = useStoreRelated(slug, product?.slug, limit ?? 4);
  return data?.items ?? [];
}

export type ProductDetail = ReturnType<typeof useProductDetail>;
