"use client";
// coding-standard: maintained

import { money } from "@/components/storefront/format";
import {
  SummaryRow,
  ghostBtn,
  input,
  primaryBtn,
} from "@/components/storefront/checkout/checkout-bits";
import { FormAlert } from "@/components/storefront/checkout/checkout-field";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/** Coupon field + apply button. */
export function CouponRow({ api }: { api: CheckoutApi }) {
  const { t, coupon, setCoupon, applyCoupon, applying } = api;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <input
        style={{ ...input, padding: "10px 12px" }}
        placeholder={t.coupon}
        value={coupon}
        onChange={(e) => setCoupon(e.target.value)}
      />
      <button
        type="button"
        onClick={applyCoupon}
        disabled={applying || !coupon.trim()}
        style={{ ...ghostBtn, padding: "0 14px", whiteSpace: "nowrap" }}
      >
        {t.applyFilters}
      </button>
    </div>
  );
}

/** Subtotal / discount / shipping / total, and the re-check footnote. */
export function SummaryLines({ api, note = true }: { api: CheckoutApi; note?: boolean }) {
  const { t, lang, currency, subtotal, discount, applied, shipping, total, isPickup, zoned, zoneLabel } = api;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <SummaryRow label={t.subtotal} value={money(subtotal, currency)} />
        {discount > 0 ? (
          <SummaryRow
            label={`${t.discount}${applied ? ` (${applied.code})` : ""}`}
            value={`− ${money(discount, currency)}`}
            accent
          />
        ) : null}
        <SummaryRow
          label={isPickup ? t.fulfillmentPickup : zoned ? `${t.shipping} · ${zoneLabel}` : t.shipping}
          value={isPickup ? t.pickupFree : shipping === 0 ? t.free : money(shipping, currency)}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 14, letterSpacing: "-0.02em" }}>
        <span>{t.total}</span>
        <span className="sf-mono">{money(total, currency)}</span>
      </div>
      {note ? (
        <p style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 10, marginBottom: 0 }}>
          {lang === "bn"
            ? "অর্ডার করার সময় দাম ও স্টক যাচাই করা হবে।"
            : "Stock & prices are re-checked when you place the order."}
        </p>
      ) : null}
    </>
  );
}

/**
 * The submit button, with the total on it — and the banner that explains a
 * refusal.
 *
 * **It is deliberately not disabled by an incomplete form.** Pressing the button
 * is how a shopper asks what is missing, and a greyed-out button answers
 * nothing; `api.submit` refuses instead, reveals every field message and scrolls
 * to the first. Only an in-flight order disables it, which is a real reason.
 */
export function PlaceOrderButton({
  api,
  withTotal = true,
  style,
}: {
  api: CheckoutApi;
  withTotal?: boolean;
  style?: React.CSSProperties;
}) {
  const { t, currency, total, placing, submit, errors, errorsRevealed } = api;
  const showAlert = errorsRevealed && Object.keys(errors).length > 0;
  return (
    <>
      {showAlert ? <FormAlert>{t.checkoutFixErrors}</FormAlert> : null}
      <button
        type="button"
        onClick={submit}
        disabled={placing}
        style={{ ...primaryBtn, width: "100%", opacity: placing ? 0.6 : 1, ...style }}
      >
        {placing ? "…" : withTotal ? `${t.placeOrder} · ${money(total, currency)}` : t.placeOrder}
      </button>
    </>
  );
}
