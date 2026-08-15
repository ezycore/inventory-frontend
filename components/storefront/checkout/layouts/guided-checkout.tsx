"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
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
 * Guided — one narrow column, every section always open, each numbered and
 * separated by a rule. No side panel, no steps, no cards inside cards.
 *
 * The calm answer, drawn for the pharmacy, and the opposite bet from `stepped`:
 * hiding two thirds of a checkout behind Continue is exactly what makes a
 * cautious buyer abandon it, because they cannot see what they are about to be
 * asked. Everything is visible and in order; the numbers say how far along they
 * are without taking anything away.
 *
 * A single ~620px column also means the form never sits beside anything, which
 * is what lets the fields stay large.
 */
export function GuidedCheckout({ api }: { api: CheckoutApi }) {
  const { t } = api;
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Step n={1} title={api.isPickup ? t.pickupHeading : t.deliveryAddress}>
        <FulfillmentToggle api={api} />
        <AddressBlock api={api} showHeading={false} />
      </Step>

      <Step n={2} title={t.paymentMethod}>
        <PaymentBlock api={api} showHeading={false} />
      </Step>

      <Step n={3} title={t.orderSummary}>
        <CouponRow api={api} />
        <SummaryLines api={api} />
      </Step>

      <Step n={4} title={t.reviewOrder} last>
        <ReviewBlock api={api} />
        <TermsBlock api={api} />
        <PlaceOrderButton api={api} style={{ marginTop: 18 }} />
      </Step>
    </div>
  );
}

/** One numbered section. The rule, not a card, is the separator. */
function Step({
  n,
  title,
  children,
  last,
}: {
  n: number;
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section
      style={{
        borderBottom: last ? "none" : "1px solid var(--border)",
        padding: "0 0 26px",
        marginBottom: 26,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 999,
            flex: "none",
            background: "var(--primary)",
            color: "var(--on-primary)",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {n}
        </span>
        <h2 style={{ fontSize: 16.5, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** Kept out of the section header so an icon change is one edit, not four. */
function GuidedLockNote({ label }: { label: string }) {
  return (
    <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, color: "var(--faint)", marginTop: 18 }}>
      <Icon name="lock" size={13} />
      {label}
    </p>
  );
}
