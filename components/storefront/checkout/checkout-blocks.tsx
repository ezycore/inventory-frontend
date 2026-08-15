"use client";
// coding-standard: maintained

import Link from "next/link";
import { cartLineKey } from "@/services/stores/use-cart-store";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import {
  SummaryRow,
  ghostBtn,
  input,
  label,
  primaryBtn,
} from "@/components/storefront/checkout/checkout-bits";
import { GuestNotice } from "@/components/storefront/checkout/guest-notice";
import { CheckoutAddressBook } from "@/components/storefront/checkout/checkout-address-book";
import { GeoPicker } from "@/components/storefront/checkout/geo-picker";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * The pieces every checkout layout is built from.
 *
 * A layout decides **where these go and how many screens they span**; it never
 * re-implements one. That matters more here than anywhere else in the
 * storefront: these blocks are bound to `useCheckout`'s state, so a copy-pasted
 * field would be a field that silently stops feeding the order.
 *
 * Everything is inline-styled against the storefront CSS vars, so a block picks
 * up the merchant's brand colour, radius and density wherever a layout puts it.
 */

const PAY_ICON: Record<string, IconName> = { cod: "coins", bank: "bank" };

/** Delivery vs in-store pickup. Renders nothing unless the store offers pickup. */
export function FulfillmentToggle({ api }: { api: CheckoutApi }) {
  const { t, pickupOffered, fulfillment, setFulfillment } = api;
  if (!pickupOffered) return null;
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
      {(["delivery", "pickup"] as const).map((f) => {
        const active = fulfillment === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => setFulfillment(f)}
            style={{
              flex: 1,
              border: `1px solid ${active ? "var(--primary)" : "var(--border-strong)"}`,
              background: active ? "var(--primary-soft)" : "var(--surface)",
              color: active ? "var(--primary)" : "var(--text)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {f === "delivery" ? t.fulfillmentDelivery : t.fulfillmentPickup}
          </button>
        );
      })}
    </div>
  );
}

/** Saved-address picker + the contact/delivery fields + the pickup panel. */
export function AddressBlock({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  const {
    t,
    lang,
    base,
    store,
    currency,
    shopper,
    addr,
    set,
    captureContact,
    geo,
    setGeo,
    savedAddresses,
    selectedId,
    isNew,
    pickSaved,
    pickNew,
    saveNew,
    setSaveNew,
    phoneInvalid,
    isPickup,
    zoned,
    zoneLabel,
    shipping,
  } = api;

  return (
    <div>
      {!isPickup && savedAddresses.length > 0 ? (
        <>
          <div style={label}>{t.savedAddresses}</div>
          <CheckoutAddressBook
            addresses={savedAddresses}
            selectedId={selectedId}
            isNew={isNew}
            onPick={pickSaved}
            onNew={pickNew}
            labels={{ newAddress: t.newAddress, default: t.default }}
          />
        </>
      ) : null}

      {/* An OFFER, not a step. Signing in prefills saved addresses and files the
          order under the account; skipping it costs nothing — the notice just
          says what "skipping it" means. */}
      {!shopper ? <GuestNotice base={base} t={t} /> : null}

      {showHeading ? (
        <div style={label}>{isPickup ? t.pickupHeading : t.deliveryAddress}</div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
        <input
          style={input}
          placeholder={t.fullName}
          value={addr.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={(e) => captureContact("name", e.target.value)}
        />
        <input
          style={phoneInvalid ? { ...input, borderColor: "#dc2626" } : input}
          placeholder={t.phone}
          value={addr.phone}
          inputMode="tel"
          onChange={(e) => set("phone", e.target.value)}
          onBlur={(e) => captureContact("phone", e.target.value)}
        />
        {/* Shown only once they have typed something — an empty field is
            incomplete, not wrong, and reads as nagging if flagged. */}
        {phoneInvalid ? (
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: -4 }}>{t.phoneInvalid}</div>
        ) : null}
        {!isPickup ? (
          <>
            <input
              style={input}
              placeholder={t.addressLine}
              value={addr.address}
              onChange={(e) => set("address", e.target.value)}
            />
            <GeoPicker
              value={geo}
              onChange={setGeo}
              lang={lang}
              labels={{ district: t.selectDistrict, area: t.selectArea, noMatch: t.comboNoMatch }}
            />
          </>
        ) : null}
        <input
          style={input}
          placeholder={t.orderNotesPh}
          value={addr.notes}
          onChange={(e) => set("notes", e.target.value)}
        />

        {/* Pickup: show the collection location + any instructions (read-only). */}
        {isPickup && store?.pickup?.location ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 14, background: "var(--surface)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>{t.pickupFrom}</div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{store.pickup.location.name}</div>
            {store.pickup.location.address ? (
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{store.pickup.location.address}</div>
            ) : null}
            {store.pickup.instructions ? (
              <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>{store.pickup.instructions}</div>
            ) : null}
          </div>
        ) : null}

        {/* Zone fee is derived from the district — shown read-only, not asked. */}
        {!isPickup && zoned && geo.district ? (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", padding: "2px 2px" }}>
            <span>
              {t.deliveryZone} · {zoneLabel}
            </span>
            <span className="sf-mono" style={{ color: "var(--text)", fontWeight: 600 }}>
              {shipping === 0 ? t.free : money(shipping, currency)}
            </span>
          </div>
        ) : null}
        {!isPickup && isNew && savedAddresses.length > 0 ? (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
            <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
            {t.saveThisAddress}
          </label>
        ) : null}
      </div>
    </div>
  );
}

/** The payment-method picker. */
export function PaymentBlock({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  const { t, methods, effectivePayment, setPayment } = api;
  return (
    <div>
      {showHeading ? <div style={label}>{t.paymentMethod}</div> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 8 }}>
        {methods.map((m) => {
          const sel = effectivePayment === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setPayment(m)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                border: `1px solid ${sel ? "var(--primary)" : "var(--border-strong)"}`,
                background: sel ? "var(--primary-soft)" : "var(--card)",
                textAlign: "left",
              }}
            >
              <span style={{ color: "var(--primary)", display: "flex" }}>
                <Icon name={PAY_ICON[m]} size={20} />
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                {m === "cod" ? t.cod : t.bankTransfer}
              </span>
              {m === "cod" ? (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--primary)", background: "var(--primary-soft)", padding: "3px 8px", borderRadius: 999 }}>
                  {t.default}
                </span>
              ) : null}
              {sel ? (
                <span style={{ color: "var(--primary)", display: "flex" }}>
                  <Icon name="dot" size={16} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The line-by-line order review (ship-to + payment recap). */
export function ReviewBlock({ api }: { api: CheckoutApi }) {
  const { t, store, currency, items, geo, isPickup, effectivePayment } = api;
  return (
    <div>
      <div style={label}>{t.reviewOrder}</div>
      {items.map((i) => (
        <div
          key={cartLineKey(i)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 13.5 }}
        >
          <span>
            {i.name}
            {i.variantLabel ? <span style={{ color: "var(--muted)" }}> · {i.variantLabel}</span> : null}{" "}
            <span className="sf-mono" style={{ color: "var(--faint)" }}>
              ×{i.quantity}
            </span>
          </span>
          <span className="sf-mono" style={{ fontWeight: 600 }}>
            {money(i.price * i.quantity, currency)}
          </span>
        </div>
      ))}
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
        {t.shipTo}:{" "}
        <span style={{ color: "var(--text)" }}>
          {isPickup
            ? `${t.fulfillmentPickup}${store?.pickup?.location ? ` · ${store.pickup.location.name}` : ""}`
            : [geo.area, geo.district].filter(Boolean).join(", ")}{" "}
          · {effectivePayment === "cod" ? t.cod : t.bankTransfer}
        </span>
      </div>
    </div>
  );
}

/**
 * Minimum-order notice + the terms checkbox.
 *
 * Renders nothing when neither applies, so a layout can place it unconditionally
 * without leaving a gap — which is what stops the four drifting on where it goes.
 */
export function TermsBlock({ api }: { api: CheckoutApi }) {
  const {
    t,
    base,
    currency,
    minOrder,
    belowMin,
    termsRequired,
    termsAccepted,
    setTermsAccepted,
    termsSlug,
  } = api;
  if (!belowMin && !termsRequired) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
      {belowMin ? (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {t.minOrderNotice} {money(minOrder, currency)}
        </div>
      ) : null}
      {termsRequired ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          {/* {terms} splits the sentence so only the terms phrase links. Clicking
              an <a> inside a <label> navigates without toggling the checkbox
              (HTML: interactive descendants don't activate it). */}
          <span>
            {t.agreeToTerms.split("{terms}").map((part, i) => (
              <span key={i}>
                {i > 0 &&
                  (termsSlug ? (
                    <Link
                      href={storeHref(base, `/pages/${termsSlug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--text)", fontWeight: 600, textDecoration: "underline" }}
                    >
                      {t.termsLinkLabel}
                    </Link>
                  ) : (
                    t.termsLinkLabel
                  ))}
                {part}
              </span>
            ))}
          </span>
        </label>
      ) : null}
    </div>
  );
}

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

/** The submit button, with the total on it. */
export function PlaceOrderButton({
  api,
  withTotal = true,
  style,
}: {
  api: CheckoutApi;
  withTotal?: boolean;
  style?: React.CSSProperties;
}) {
  const { t, currency, total, canSubmit, placing, submit } = api;
  const blocked = !canSubmit || placing;
  return (
    <button
      type="button"
      onClick={submit}
      disabled={blocked}
      style={{ ...primaryBtn, width: "100%", opacity: blocked ? 0.6 : 1, ...style }}
    >
      {placing ? "…" : withTotal ? `${t.placeOrder} · ${money(total, currency)}` : t.placeOrder}
    </button>
  );
}
