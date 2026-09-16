"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CSSProperties } from "react";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import type { CartPageApi } from "@/components/storefront/cart/use-cart-page";
import { deliveryEstimateSummary } from "@/lib/storefront-delivery";
import { brandButton } from "@/lib/storefront-button";

/** The pieces every cart layout is built from. Layouts arrange, never re-implement. */

const qtyBtn: CSSProperties = {
  background: "var(--surface)",
  color: "var(--text)",
  border: "none",
  width: 40,
  height: 40,
  fontSize: 16,
  cursor: "pointer",
};

/** Padding (not a size) grows the 16px glyph to a 40px touch target without
 *  moving it — the icon stays optically aligned with the line total. */
const removeBtn: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--faint)",
  display: "flex",
  padding: 12,
  margin: -12,
};

/** Stepper + line total + remove. Shared so the 40px touch targets can't drift. */
function QtyControls({
  api,
  item,
  showTotal = true,
}: {
  api: CartPageApi;
  item: CartPageApi["items"][number];
  showTotal?: boolean;
}) {
  const { t, currency, updateQty, removeItem, lineKey } = api;
  const key = lineKey(item);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <button type="button" onClick={() => updateQty(key, item.quantity - 1)} style={qtyBtn}>
          −
        </button>
        <span className="sf-mono" style={{ fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: "center" }}>
          {item.quantity}
        </span>
        <button type="button" onClick={() => updateQty(key, item.quantity + 1)} style={qtyBtn}>
          +
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {showTotal ? (
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {money(item.price * item.quantity, currency)}
          </span>
        ) : null}
        <button type="button" onClick={() => removeItem(key)} aria-label={t.remove} style={removeBtn}>
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}

/** One cart line. `thumb` sizes the photo — the editorial layout wants it large. */
export function CartLine({
  api,
  item,
  thumb = 76,
}: {
  api: CartPageApi;
  item: CartPageApi["items"][number];
  thumb?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ width: thumb, height: thumb, flex: "none" }}>
        <Media src={item.image} alt={item.name} radius={10} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 10 }}>
          {item.name}
          {item.variantLabel ? (
            <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {item.variantLabel}</span>
          ) : null}
        </div>
        <QtyControls api={api} item={item} />
      </div>
    </div>
  );
}

/** Subtotal / shipping / total, the estimate note, and the checkout button. */
export function CartSummary({ api, cta = true }: { api: CartPageApi; cta?: boolean }) {
  const { t, base, store, currency, subtotal, shipping, estimated, total, amount } = api;
  const deliveryEstimate = deliveryEstimateSummary(store, {
    insideDhaka: t.insideDhaka,
    outsideDhaka: t.outsideDhaka,
    fallback: t.deliveryOptionsCheckout,
  });
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
        <Row label={t.subtotal} value={money(subtotal, currency)} />
        <Row label={t.shipping} value={shipping === 0 && !estimated ? t.free : amount(shipping)} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: estimated ? 8 : 16, letterSpacing: "-0.02em" }}>
        <span>{t.total}</span>
        <span className="sf-mono">{amount(total)}</span>
      </div>
      {/* Say why it is a range, so "From" doesn't read as evasive. */}
      {estimated ? (
        <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
          {t.deliveryEstimateNote}
        </p>
      ) : null}
      {cta ? (
        <>
          <Link
            href={storeHref(base, "/checkout")}
            style={{ ...brandButton({ radius: "var(--radius-md)", padding: 14, fontSize: 14.5 }), display: "block", textAlign: "center", fontWeight: 700 }}
          >
            {t.proceed}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", marginTop: 14, justifyContent: "center" }}>
            <Icon name="truck" size={18} /> {deliveryEstimate}
          </div>
        </>
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--muted)" }}>
      <span>{label}</span>
      <span className="sf-mono">{value}</span>
    </div>
  );
}

/** Nothing in the cart. Identical in every layout — an empty state has no anatomy. */
export function EmptyCart({ api }: { api: CartPageApi }) {
  const { t, base } = api;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "60px 30px", textAlign: "center", color: "var(--faint)" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <Icon name="cart" size={44} />
      </div>
      <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 20px" }}>{t.emptyCartMsg}</p>
      <Link
        href={storeHref(base, "/products")}
        style={{ ...brandButton({ radius: "var(--radius-md)", padding: "12px 24px", fontSize: 14 }), display: "inline-block", fontWeight: 600 }}
      >
        {t.viewAllProducts}
      </Link>
    </div>
  );
}

/** The page heading with its item count. */
export function CartHeading({ api }: { api: CartPageApi }) {
  const { t, count } = api;
  return (
    <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
      {t.cartTitle}{" "}
      <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: "0.7em" }}>
        ({count} {t.items})
      </span>
    </h1>
  );
}
