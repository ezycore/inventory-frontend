"use client";
// coding-standard: maintained

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeHref } from "@/lib/storefront-links";
import { resolveCartCap } from "@/lib/storefront-cart-qty";
import { useStoreContext } from "@/services/storefront/store-context";
import { useBuyNowStore } from "@/services/stores/use-buy-now-store";
import { cartLineKey, useCartStore, type CartItem } from "@/services/stores/use-cart-store";

/**
 * Buy now — one line, straight to checkout, cart untouched.
 *
 * Every Buy now button (product page, Single product section, card, quick-buy
 * sheet) goes through `useStartBuyNow`, and checkout knows it is ordering that
 * line rather than the cart by **two** things together: the line in
 * `useBuyNowStore`, and `?buy=1` on the URL. The URL is what makes the rest
 * free — a reload keeps it, Back leaves it, and every "Checkout" link from the
 * cart is a plain `/checkout` that orders the cart as before, with no entry
 * point having to remember to end a buy-now first.
 */
export const BUY_NOW_PARAM = "buy";

/** The checkout URL a Buy now press opens. */
export const buyNowHref = (base: string) =>
  storeHref(base, `/checkout?${BUY_NOW_PARAM}=1`);

/** Whether a location's query string is a buy-now checkout. */
export const isBuyNowSearch = (search: string) =>
  new URLSearchParams(search).get(BUY_NOW_PARAM) === "1";

/** Start a buy-now checkout for one line. Returns false for a sold-out line. */
export function useStartBuyNow() {
  const { slug, base } = useStoreContext();
  const router = useRouter();
  const start = useBuyNowStore((s) => s.start);
  return useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1): boolean => {
      // The cart's own rule (`addItem`): a zero cap is sold out, never unlimited.
      const cap = resolveCartCap(item.maxQty);
      if (cap <= 0) return false;
      start(slug, { ...item, quantity: Math.max(1, Math.min(cap, qty)) });
      router.push(buyNowHref(base));
      return true;
    },
    [base, router, slug, start],
  );
}

/** The line this checkout orders instead of the cart, if it is a buy-now one. */
export function useBuyNowLine(): CartItem | undefined {
  const { slug } = useStoreContext();
  // Null outside an app-router tree (a component test) — read as "not buy now".
  const onBuyNowUrl = useSearchParams()?.get(BUY_NOW_PARAM) === "1";
  const line = useBuyNowStore((s) => (s.storeSlug === slug ? s.line : null));
  return onBuyNowUrl && line ? line : undefined;
}

/**
 * The cart lines a buy-now checkout leaves out, and the action that folds the
 * buy-now line into the cart and orders the lot.
 *
 * A line the cart already holds keeps the LARGER of the two quantities: pressing
 * Buy now on a product already in the basket was asking for that product, not
 * for a second one on top.
 */
export function useBuyNowCartMerge(line: CartItem | undefined) {
  const { slug, base } = useStoreContext();
  const router = useRouter();
  const storeSlug = useCartStore((s) => s.storeSlug);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const end = useBuyNowStore((s) => s.end);

  const key = line ? cartLineKey(line) : null;
  const cart = storeSlug === slug ? items : [];
  const others = line ? cart.filter((i) => cartLineKey(i) !== key) : [];

  const merge = () => {
    if (!line || !key) return;
    const existing = cart.find((i) => cartLineKey(i) === key);
    if (existing) {
      updateQty(key, Math.max(existing.quantity, line.quantity));
    } else {
      const { quantity, ...item } = line;
      addItem(slug, item, quantity);
    }
    end();
    // Replace, not push: Back should not return to a checkout that no longer
    // matches the shopper's order.
    router.replace(storeHref(base, "/checkout"));
  };

  return { otherLines: others.length, merge };
}
