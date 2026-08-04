"use client";
// coding-standard: maintained

import Link from "next/link";
import { type CSSProperties } from "react";
import { useStore } from "@/services/storefront/hooks";
import { useCartRestore } from "@/services/storefront/use-cart-restore";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { cartLineKey, useCartStore } from "@/services/stores/use-cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { storeHref } from "@/lib/storefront-links";
import { shippingRange } from "@/lib/storefront-shipping";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

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

export default function CartPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const { data: store } = useStore(slug);

  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const hydrated = useHydrated();

  // `?recover=<token>` from an abandoned-cart email rebuilds the cart from the
  // server — the shopper is usually on a different device than the one that
  // built it, which is the entire point of the link. No-ops without the param.
  useCartRestore(slug);

  // The cart lives in a persisted (localStorage) store the server can't read.
  // Hold the neutral shell until hydration so the first client render matches
  // the SSR HTML — otherwise React hydration mismatches and the empty-cart CTA
  // flashes before the persisted items appear.
  if (!hydrated) return <div style={wrap} aria-busy="true" />;

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // The delivery zone comes from the district picked at CHECKOUT, so here it is
  // genuinely unknown. Show the cheapest possible fee prefixed "From" rather than
  // silently quoting the inside-Dhaka rate to someone who will be charged the
  // outside one — an unexpected delivery charge is the largest single cause of
  // abandonment, and understating it is the worst version of that.
  const { min: shipping, estimated } = shippingRange(store, subtotal);
  const total = subtotal + shipping;
  const amount = (value: number) =>
    estimated ? `${t.fromPrice} ${money(value, currency)}` : money(value, currency);

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
        {t.cartTitle}{" "}
        <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: "0.7em" }}>
          ({count} {t.items})
        </span>
      </h1>

      {items.length === 0 ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "60px 30px", textAlign: "center", color: "var(--faint)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="cart" size={44} />
          </div>
          <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 20px" }}>{t.emptyCartMsg}</p>
          <Link href={storeHref(base, "/products")} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
            {t.viewAllProducts}
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 18px" }}>
            {items.map((i, index) => (
              <div key={cartLineKey(i)} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: index < items.length-1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 76, height: 76, flex: "none" }}>
                  <Media src={i.image} alt={i.name} radius={10} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 10 }}>
                    {i.name}
                    {i.variantLabel ? (
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {i.variantLabel}</span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: 8, overflow: "hidden" }}>
                      <button type="button" onClick={() => updateQty(cartLineKey(i), i.quantity - 1)} style={qtyBtn}>−</button>
                      <span className="sf-mono" style={{ fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: "center" }}>{i.quantity}</span>
                      <button type="button" onClick={() => updateQty(cartLineKey(i), i.quantity + 1)} style={qtyBtn}>+</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{money(i.price * i.quantity, currency)}</span>
                      <button type="button" onClick={() => removeItem(cartLineKey(i))} aria-label={t.remove} style={removeBtn}>
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>{t.orderSummary}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
              <SummaryRow label={t.subtotal} value={money(subtotal, currency)} />
              <SummaryRow
                label={t.shipping}
                value={shipping === 0 && !estimated ? t.free : amount(shipping)}
              />
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
            <Link href={storeHref(base, "/checkout")} style={{ display: "block", textAlign: "center", background: "var(--primary)", color: "var(--on-primary)", padding: 14, borderRadius: 9, fontSize: 14.5, fontWeight: 700 }}>
              {t.proceed}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", marginTop: 14, justifyContent: "center" }}>
              <Icon name="truck" size={18} /> {t.deliveryEst}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--muted)" }}>
      <span>{label}</span>
      <span className="sf-mono">{value}</span>
    </div>
  );
}
