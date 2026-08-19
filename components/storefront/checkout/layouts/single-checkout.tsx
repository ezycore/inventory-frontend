"use client";
// coding-standard: maintained

import {
  ContactFields,
  CouponRow,
  DeliveryFields,
  FulfillmentToggle,
  OrderLines,
  PaymentBlock,
  PlaceOrderButton,
  SectionCard,
  SummaryLines,
  TermsBlock,
  TrustStrip,
} from "@/components/storefront/checkout/checkout-blocks";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Single — everything on one page: three numbered cards, and the order beside
 * them.
 *
 * The layout's whole job is the split into **Contact / Delivery / Payment**.
 * That is the one thing the old single-page checkout did not have: seven fields
 * ran together in a single card, so nothing said how much of the form was left
 * or which answer belonged to which question. The blocks supply the fields and
 * their labels; the numbering lives here, because `guided` already numbers its
 * own sections and a block that numbered itself would collide with it.
 *
 * The rail carries the money AND the button. Putting the submit next to the
 * total means the last thing under the shopper's eye before they commit is the
 * amount they are committing to — and on a phone, where the rail stacks under
 * the form, that lands it exactly where the form ends anyway.
 *
 * The rail STICKS, offset by `--sf-header-h` — which `StoreHeader` measures,
 * because the five header templates are five different heights. Without it the
 * button sat above the end of a three-card form: the shopper picked a payment
 * method and then had to scroll back UP to order, which is worse than where the
 * old single-column layout left it.
 */
export function SingleCheckout({ api }: { api: CheckoutApi }) {
  const { t, isPickup } = api;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        <SectionCard n={1} title={t.contactHeading}>
          <ContactFields api={api} showHeading={false} />
        </SectionCard>

        <SectionCard n={2} title={isPickup ? t.pickupHeading : t.deliveryAddress}>
          {/* The toggle heads this card rather than the page: it chooses HOW the
              order arrives, so it belongs to the section it rewrites. */}
          <FulfillmentToggle api={api} />
          <DeliveryFields api={api} showHeading={false} />
        </SectionCard>

        <SectionCard n={3} title={t.paymentMethod}>
          <PaymentBlock api={api} showHeading={false} />
        </SectionCard>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 20,
          position: "sticky",
          // Falls back to a bare 14px gap if the header has not measured yet,
          // which is the one frame between hydration and the ResizeObserver.
          top: "calc(var(--sf-header-h, 0px) + 14px)",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>{t.orderSummary}</h2>
        <OrderLines api={api} />
        <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
        <CouponRow api={api} />
        <SummaryLines api={api} />
        <TermsBlock api={api} />
        <PlaceOrderButton api={api} style={{ marginTop: 16 }} />
        <TrustStrip api={api} />
      </div>
    </div>
  );
}
