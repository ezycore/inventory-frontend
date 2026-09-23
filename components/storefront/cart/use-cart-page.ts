"use client";
// coding-standard: maintained

import { useStore } from "@/services/storefront/hooks";
import { useCartRestore } from "@/services/storefront/use-cart-restore";
import { usePreviewCart } from "@/services/storefront/use-preview-cart";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { cartLineKey, useCartStore } from "@/services/stores/use-cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { shippingRange } from "@/lib/storefront-shipping";
import { money } from "@/components/storefront/format";

/**
 * Everything the cart page DOES. Four layouts, one implementation.
 *
 * The delivery estimate is the part that must not be duplicated: the zone comes
 * from the district picked at CHECKOUT, so here it is genuinely unknown, and the
 * page shows the cheapest possible fee prefixed "From" rather than quoting the
 * inside-Dhaka rate to someone who will be charged the outside one. An
 * unexpected delivery charge is the largest single cause of abandonment, and a
 * layout that decided to "simplify" that into a flat number would cause it.
 */
export function useCartPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const { data: store } = useStore(slug);

  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const cartUpdateQty = useCartStore((s) => s.updateQty);
  const cartRemoveItem = useCartStore((s) => s.removeItem);
  const hydrated = useHydrated();

  // `?recover=<token>` from an abandoned-cart email rebuilds the cart from the
  // server — the shopper is usually on a different device than the one that
  // built it, which is the entire point of the link. No-ops without the param.
  useCartRestore(slug);

  const cartItems = storeSlug === slug ? allItems : [];
  /* Inside the page editor's frame an empty basket draws the empty-cart card and
     nothing else, so the layout being chosen — and everything arranged around it
     — is invisible. `usePreviewCart` fills it there and ONLY there; `null` on
     every real visit, which is why it can sit on the path the whole shop runs. */
  const preview = usePreviewCart(cartItems);
  const items = preview?.items ?? cartItems;
  const updateQty = preview?.updateQty ?? cartUpdateQty;
  const removeItem = preview?.removeItem ?? cartRemoveItem;
  const currency = store?.currency;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const { min: shipping, estimated } = shippingRange(store, subtotal);
  const total = subtotal + shipping;
  const amount = (value: number) =>
    estimated ? `${t.fromPrice} ${money(value, currency)}` : money(value, currency);

  return {
    t,
    base,
    store,
    hydrated,
    items,
    /** These lines are the editor preview's sample, not a real basket. */
    sampleCart: preview?.sample ?? false,
    currency,
    count,
    subtotal,
    shipping,
    estimated,
    total,
    amount,
    updateQty,
    removeItem,
    lineKey: cartLineKey,
  };
}

export type CartPageApi = ReturnType<typeof useCartPage>;
