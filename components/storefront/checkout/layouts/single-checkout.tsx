"use client";
// coding-standard: maintained

import {
  AddressBlock,
  CouponRow,
  FulfillmentToggle,
  PaymentBlock,
  PlaceOrderButton,
  SummaryLines,
  TermsBlock,
} from "@/components/storefront/checkout/checkout-blocks";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Single — everything on one page, with the summary in a sticky side panel.
 *
 * **The storefront's original checkout, unchanged**, which is why Classic stamps
 * it and why it is the resolver's default: a shop that has never opened Themes
 * must check out exactly as it did before layouts existed. `--cartgrid`
 * collapses the two columns on a phone.
 */
export function SingleCheckout({ api }: { api: CheckoutApi }) {
  const { t } = api;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 }}>
        <FulfillmentToggle api={api} />
        <AddressBlock api={api} />
        <PaymentBlock api={api} />
        <TermsBlock api={api} />
        <PlaceOrderButton api={api} style={{ marginTop: 6 }} />
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>{t.orderSummary}</h3>
        <CouponRow api={api} />
        <SummaryLines api={api} />
      </div>
    </div>
  );
}
