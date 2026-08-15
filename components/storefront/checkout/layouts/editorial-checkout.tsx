"use client";
// coding-standard: maintained

import {
  AddressBlock,
  CouponRow,
  FulfillmentToggle,
  PaymentBlock,
  PlaceOrderButton,
  ReviewBlock,
  SummaryLines,
  TermsBlock,
} from "@/components/storefront/checkout/checkout-blocks";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Editorial — the order on the **left** as a quiet list, the form on the right,
 * no cards anywhere. The boutique answer.
 *
 * Two deliberate inversions of `single`:
 *
 * 1. **The summary leads.** A boutique order is one or two considered items, and
 *    seeing the piece you are buying while you type your address is reassurance,
 *    not clutter. A grocery basket of thirty lines would be the opposite, which
 *    is exactly why this is a layout and not a global change.
 * 2. **No containers.** Every other checkout puts the form in a bordered card;
 *    this one uses hairlines and space, matching the `boutique` header and the
 *    chrome-less product card. A shop that drops its card borders everywhere
 *    else and keeps them at checkout looks like it handed the shopper to
 *    somebody else's site at the last step — which is where trust matters most.
 */
export function EditorialCheckout({ api }: { api: CheckoutApi }) {
  const { t } = api;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--splitcols)", gap: "clamp(26px,4vw,60px)", alignItems: "start" }}>
      {/* Summary first in the DOM as well as on screen, so a phone (where the
          grid collapses to one column) shows what is being bought before asking
          for an address. */}
      <aside>
        <h2 style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, margin: "0 0 18px" }}>
          {t.orderSummary}
        </h2>
        <ReviewBlock api={api} />
        <div style={{ marginTop: 22 }}>
          <CouponRow api={api} />
          <SummaryLines api={api} />
        </div>
      </aside>

      <div>
        <h2 style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, margin: "0 0 18px" }}>
          {t.checkout}
        </h2>
        <FulfillmentToggle api={api} />
        <AddressBlock api={api} />
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 22 }}>
          <PaymentBlock api={api} />
        </div>
        <TermsBlock api={api} />
        <PlaceOrderButton api={api} style={{ marginTop: 20 }} />
      </div>
    </div>
  );
}
