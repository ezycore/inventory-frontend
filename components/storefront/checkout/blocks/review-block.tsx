"use client";
// coding-standard: maintained

import { label } from "@/components/storefront/checkout/checkout-bits";
import { OrderLines } from "@/components/storefront/checkout/blocks/order-lines";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";
import { storefrontPaymentMethodLabel } from "@/lib/storefront-payment-methods";

/**
 * The order review — the lines, then the ship-to and payment recap.
 *
 * The lines come from `OrderLines` rather than a second copy of the same map:
 * this block and the summary rail were the two places a cart line got rendered,
 * and two renderers of one list is how a variant label stops showing up in one
 * of them. It asks for the text variant, since a review is read, not browsed.
 */
export function ReviewBlock({ api }: { api: CheckoutApi }) {
  const { t, store, geo, isPickup, effectivePayment } = api;
  return (
    <div>
      <div style={label}>{t.reviewOrder}</div>
      <OrderLines api={api} thumbs={false} />
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
        {t.shipTo}:{" "}
        <span style={{ color: "var(--text)" }}>
          {isPickup
            ? `${t.fulfillmentPickup}${store?.pickup?.location ? ` · ${store.pickup.location.name}` : ""}`
            : [geo.area, geo.district].filter(Boolean).join(", ")}{" "}
          · {storefrontPaymentMethodLabel(effectivePayment, t, store?.paymentMethods)}
        </span>
      </div>
    </div>
  );
}
