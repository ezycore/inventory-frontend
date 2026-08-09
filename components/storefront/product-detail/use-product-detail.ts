"use client";
// coding-standard: maintained

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import {
  useStore,
  useStoreCategories,
  useStoreProduct,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useWishlistStore } from "@/services/stores/use-wishlist-store";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl, thumbImageUrl } from "@/lib/storefront-image";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import {
  defaultSelection,
  matchVariant,
} from "@/components/storefront/variant-selector";
import type { CatalogProduct, CatalogVariant } from "@/lib/storefront-client";

/**
 * Everything the product page knows and can do — queries, shopper selection, the
 * prices and stock those two resolve to, and the three actions.
 *
 * Split out of the page component so the page is composition and this is
 * behaviour. The split point is deliberate: **every hook lives here**, so the
 * page's loading/error early-returns can never make a hook call conditional —
 * the trap the old file carried two comments about.
 */
export function useProductDetail(initialProduct?: CatalogProduct) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const productSlug = String(useParams().productSlug);

  const { data: store } = useStore(slug);
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

  const addItem = useCartStore((s) => s.addItem);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore(
    (s) => s.storeSlug === slug && s.items.some((i) => i.productId === product?._id),
  );

  const [qty, setQty] = useState(1);
  // Gallery image the shopper tapped (clamped later — variant switches can swap
  // in a shorter image list).
  const [imgIdx, setImgIdx] = useState(0);
  // Variant chip selection (variable products) — empty until the shopper picks,
  // in which case the first in-stock variant acts as the default.
  const [picked, setPicked] = useState<Record<string, string>>({});

  // The component survives PDP→PDP navigation (related products), so shopper
  // state resets per product — render-time adjust, per react.dev's "adjusting
  // state when a prop changes" guidance (no effect, no extra pass).
  const [prevSlug, setPrevSlug] = useState(productSlug);
  if (prevSlug !== productSlug) {
    setPrevSlug(productSlug);
    setQty(1);
    setPicked({});
    setImgIdx(0);
  }

  const variant = useStoreTemplate(store, "product");

  const variable = product?.productType === "variable";
  const variants: CatalogVariant[] = product?.variants ?? [];

  // Selected variant: shopper's picks win, else default to first in-stock.
  const selection = Object.keys(picked).length ? picked : defaultSelection(variants);
  const selectedVariant = variable ? matchVariant(variants, selection) : undefined;

  // Variable products price/stock/gallery from the selected variant; a variant
  // with images swaps the gallery, otherwise the parent images stay.
  const price = (variable ? selectedVariant?.price : product?.price) ?? 0;
  const compareAt = variable ? selectedVariant?.compareAtPrice : product?.compareAtPrice;
  const availableQty = variable
    ? (selectedVariant?.availableQuantity ?? 0)
    : (product?.availableQuantity ?? 0);
  const outOfStock = availableQty <= 0;
  // Backorder products stay buyable past zero stock; only "show"/"hide" products
  // are truly sold out. `soldOut` gates the buy buttons + the red stock badge.
  const canBackorder = product?.outOfStockBehavior === "backorder";
  const images =
    variable && selectedVariant?.images?.length
      ? selectedVariant.images
      : (product?.images ?? []);

  const add = (notify = true) => {
    if (!product) return;
    if (variable && !selectedVariant) return;
    addItem(
      slug,
      {
        productId: product._id,
        variantId: selectedVariant?._id,
        variantLabel: selectedVariant?.label,
        slug: product.slug,
        name: product.name,
        price,
        image: thumbImageUrl(images[0] ?? product.images?.[0]),
        maxQty: cartLineCap(availableQty, canBackorder),
      },
      qty,
    );
    if (notify) toast.success(t.added);
  };

  const buyNow = () => {
    // Straight to checkout, matching the card's Buy now — "Buy now" has to mean
    // the same thing on both surfaces or it means nothing. (It opened the cart
    // drawer until 2026-08-01; /cart is still reachable from the cart icon.)
    // No toast: the screen change is the confirmation.
    add(false);
    router.push(storeHref(base, "/checkout"));
  };

  const onWish = () => {
    if (!product) return;
    toggleWish(slug, {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      // The wishlist renders this at card size, not as a row thumb.
      image: cardImageUrl(product.images?.[0]),
      hasVariants: variable,
      availableQuantity: product.availableQuantity,
      outOfStockBehavior: product.outOfStockBehavior,
    });
  };

  return {
    slug,
    base,
    t,
    productSlug,
    store,
    categories,
    product,
    isLoading,
    isError,
    currency: store?.currency,
    /** Gallery above the info column on every layout except "gallery left". */
    galleryTop: variant !== "left",
    /** The "sticky bar" layout — <ProductStickyBar> measures its own height. */
    sticky: variant === "sticky",
    variable,
    variants,
    selection,
    selectedVariant,
    price,
    compareAt,
    hasOld: !!compareAt && compareAt > price,
    availableQty,
    outOfStock,
    canBackorder,
    soldOut: outOfStock && !canBackorder,
    images,
    related: (relatedData?.items ?? []).filter((p) => p.slug !== product?.slug).slice(0, 4),
    qty,
    setQty,
    imgIdx,
    setImgIdx,
    setPicked,
    wished,
    add,
    buyNow,
    onWish,
  };
}

export type ProductDetail = ReturnType<typeof useProductDetail>;
