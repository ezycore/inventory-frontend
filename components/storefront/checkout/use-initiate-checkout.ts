"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef } from "react";
import { metaContentId, trackMetaEvent } from "@/lib/storefront-meta";
import { ga4LineItem, ga4Money, trackGa4Event } from "@/lib/storefront-ga4";
import type { CartItem } from "@/services/stores/use-cart-store";

type MetaStore = Parameters<typeof trackMetaEvent>[0];

/**
 * Meta `InitiateCheckout` and GA4 `begin_checkout` — once per checkout, never once per keystroke.
 *
 * On the checkout page it fires on arrival: arriving there IS starting a
 * checkout. A landing page's order form is on the page from the first paint, so
 * arriving means nothing — there it fires on the shopper's first edit
 * (`onArrival: false`, then call the returned `report`).
 *
 * Gated on a hydrated, non-empty basket: on the server there is no cart, and on
 * the first client render the persisted store has not rehydrated yet, so an
 * ungated report sends an empty basket worth 0. `num_items` is sent here and
 * nowhere else — Meta documents it for this event alone.
 */
export function useInitiateCheckout({
  store,
  items,
  hydrated,
  onArrival,
}: {
  store: MetaStore;
  items: CartItem[];
  hydrated: boolean;
  onArrival: boolean;
}) {
  const reported = useRef(false);
  // The report reads the basket as it is when it fires, not as it was when the
  // callback was made — so the callback can stay stable for every field's onChange.
  const latest = useRef({ store, items });
  useEffect(() => {
    latest.current = { store, items };
  });

  const report = useCallback(() => {
    const { store: current, items: basket } = latest.current;
    if (reported.current || basket.length === 0) return;
    reported.current = true;
    trackMetaEvent(current, "InitiateCheckout", {
      currency: current?.currency,
      value: Number(basket.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)),
      content_type: "product",
      num_items: basket.reduce((sum, i) => sum + i.quantity, 0),
      content_ids: basket.map((i) => metaContentId(i.productId, i.variantId)),
      contents: basket.map((i) => ({
        id: metaContentId(i.productId, i.variantId),
        quantity: i.quantity,
        item_price: i.price,
      })),
    });
    // GA4 `begin_checkout`, same moment. No order discount exists yet, so the list prices add up
    // to `value` exactly.
    trackGa4Event(current, "begin_checkout", {
      ...ga4Money(current, basket.reduce((sum, i) => sum + i.price * i.quantity, 0)),
      items: basket.map((i, index) => ga4LineItem(i, i.quantity, index)),
    });
  }, []);

  // Deliberately keyed on the basket's SIZE: this must fire on arrival, not
  // re-fire as the shopper edits the cart or a coupon recomputes the total.
  useEffect(() => {
    if (onArrival && hydrated && items.length > 0) report();
  }, [onArrival, hydrated, items.length, report]);

  return report;
}
