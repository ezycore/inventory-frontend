"use client";
// coding-standard: maintained

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { metaContentId, trackMetaEvent } from "@/lib/storefront-meta";
import { ga4LineItem, ga4Money, trackGa4Event } from "@/lib/storefront-ga4";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useWishlistStore } from "@/services/stores/use-wishlist-store";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { choiceLine, resolveProductChoice } from "@/components/storefront/product-choice";
import type { CatalogProduct } from "@/lib/storefront-client";

/**
 * Buying one product: the shopper's option picks, quantity and photo, the price
 * and stock those resolve to, and the three actions — add to cart, buy now,
 * wishlist.
 *
 * The product page and a landing page's Single product section both buy through
 * this, so the two cannot drift. Fetching the product is the caller's job: the
 * product page loads it by its URL, a section by the product the merchant
 * picked.
 *
 * `resetKey` names the product being shown. When it changes the picks, quantity
 * and photo start over — the product page survives navigation to a related
 * product, and would otherwise carry one product's size onto the next.
 */
export function useProductBuy(product: CatalogProduct | undefined, resetKey: string) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const { data: store } = useStore(slug);

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

  // Render-time adjust, per react.dev's "adjusting state when a prop changes"
  // guidance (no effect, no extra pass).
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setQty(1);
    setPicked({});
    setImgIdx(0);
  }

  // Price, stock and gallery for the shopper's pick — the same answer the
  // quick-buy sheet and a landing page's order form give. Backorder products
  // stay buyable past zero stock on every surface that branches on stock: the
  // buy button, the stepper, the cart cap and the chips.
  const choice = resolveProductChoice(product, picked);
  const { variable, selected: selectedVariant, price } = choice;

  // Meta `ViewContent` and GA4 `view_item` — one per product the shopper opens.
  //
  // Keyed on the product id, NOT on this hook's render: it re-runs on every variant selection,
  // quantity tap and related-products refetch, and reporting each of those as a fresh product
  // view would multiply a single visit into a dozen. The variant is deliberately not part of the
  // key either — picking a size is not viewing a second product.
  const viewedProductId = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Waits for the store too: marking the product viewed before the store payload arrives
    // would spend the one report on a send that cannot happen.
    if (!product || !store || viewedProductId.current === product._id) return;
    viewedProductId.current = product._id;
    trackMetaEvent(store, "ViewContent", {
      currency: store.currency,
      value: price,
      content_ids: [metaContentId(product._id)],
      content_name: product.name,
      content_type: "product",
    });
    // GA4 `view_item`, same moment and same once-per-product rule. No variant: the page opens
    // before the shopper picks one, and a size pick is not a second product view.
    trackGa4Event(store, "view_item", {
      ...ga4Money(store, price),
      items: [ga4LineItem({ productId: product._id, name: product.name, price }, 1)],
    });
    // `price` is read but intentionally not a dependency — see the keying note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id, store]);

  /** False when nothing was added: no product yet, or a variable product with no option matched. */
  const add = (notify = true): boolean => {
    if (!product) return false;
    if (variable && !selectedVariant) return false;
    const { quantity, ...item } = choiceLine(product, choice, qty);
    addItem(slug, item, quantity);
    if (notify) toast.success(t.added);
    return true;
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
    store,
    product,
    currency: store?.currency,
    variable,
    variants: choice.variants,
    selection: choice.selection,
    selectedVariant,
    price,
    compareAt: choice.compareAt,
    hasOld: choice.hasOld,
    availableQty: choice.availableQty,
    canBackorder: choice.canBackorder,
    /**
     * Only "show"/"hide" products are truly sold out. It gates the buy buttons
     * and the red stock badge, and it is the ONLY stock fact the page states: a
     * backorder product is presented as an ordinary available one.
     */
    soldOut: choice.soldOut,
    images: choice.images,
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

export type ProductBuy = ReturnType<typeof useProductBuy>;
