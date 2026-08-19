"use client";
// coding-standard: maintained

import { money } from "@/components/storefront/format";
import {
  StepsBar,
  ghostBtn,
  primaryBtn,
} from "@/components/storefront/checkout/checkout-bits";
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
 * Stepped — address → payment → review, one at a time, over a **sticky running
 * total** that never leaves the screen.
 *
 * The quick-commerce answer. A grocery basket is thirty lines long, so the
 * single-page summary panel is scrolled far out of view by the time the shopper
 * reaches the button; the running total follows them instead. Steps also keep
 * each screen short enough that a phone keyboard does not bury the next control.
 *
 * The step gate is `api.tryAdvance`, not a local rule — it already carries the
 * BD phone check, which is what stops a guest advancing past step 1 with a junk
 * number and meeting the 400 two screens later. It REFUSES and points at the
 * offending field rather than sitting disabled: a dead Continue is the same
 * silence this change removes, and on a stepped form it is worse, because the
 * shopper cannot even see which field is holding them.
 */
export function SteppedCheckout({ api }: { api: CheckoutApi }) {
  const { t, currency, total, step, setStep, tryAdvance } = api;
  const steps = [
    { n: 1, label: t.stepAddress },
    { n: 2, label: t.stepPayment },
    { n: 3, label: t.stepReview },
  ];

  return (
    <>
      <StepsBar steps={steps} step={step} />

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
        {step === 1 ? (
          <>
            <FulfillmentToggle api={api} />
            <AddressBlock api={api} />
          </>
        ) : null}
        {step === 2 ? (
          <>
            <PaymentBlock api={api} />
            <CouponRow api={api} />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <ReviewBlock api={api} />
            <TermsBlock api={api} />
          </>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} style={ghostBtn}>
              {t.backStep}
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              onClick={tryAdvance}
              style={{ ...primaryBtn, flex: 1 }}
            >
              {t.continueStep}
            </button>
          ) : (
            <PlaceOrderButton api={api} withTotal={false} style={{ flex: 1, width: "auto" }} />
          )}
        </div>
      </div>

      {/* The running total. Sticky at the BOTTOM rather than a side panel:
          a thirty-line grocery basket scrolls its summary off the screen long
          before the shopper reaches the button, and the number they care about
          between steps is the one they are about to pay. */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 3,
          marginTop: 16,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "13px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxShadow: "0 -6px 18px -12px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{t.total}</span>
        <span className="sf-mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {money(total, currency)}
        </span>
      </div>

      {/* The full breakdown stays available, just below the fold rather than
          beside the form — the sticky bar answers "how much", this answers "why". */}
      <div style={{ marginTop: 16, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>{t.orderSummary}</h3>
        <SummaryLines api={api} />
      </div>
    </>
  );
}
