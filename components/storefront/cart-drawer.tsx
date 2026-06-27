"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/services/storefront/hooks";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useCartUI } from "@/services/stores/use-cart-ui-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { computeShipping } from "@/lib/storefront-shipping";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";

/**
 * Slide-over cart (the "drawer" cart variant). Quick cart review + totals; the
 * Checkout CTA routes to the full checkout page where coupon validation and
 * order placement happen against the backend.
 */
export function CartDrawer() {
  const router = useRouter();
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const { data: store } = useStore(slug);

  const open = useCartUI((s) => s.open);
  const closeCart = useCartUI((s) => s.closeCart);

  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  if (!open) return null;

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = computeShipping(store, subtotal);
  const total = subtotal + shipping;

  const goCheckout = () => {
    closeCart();
    router.push(storeHref(base, "/checkout"));
  };

  return (
    <>
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          zIndex: 80,
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 94%)",
          background: "var(--card)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 50px -20px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            {t.yourCart}{" "}
            <span style={{ color: "var(--muted)", fontWeight: 500 }}>({count})</span>
          </h3>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              textAlign: "center",
              color: "var(--faint)",
            }}
          >
            <Icon name="cart" size={44} />
            <p style={{ fontSize: 15, color: "var(--muted)", margin: "14px 0 20px" }}>
              {t.emptyCartMsg}
            </p>
            <button
              type="button"
              onClick={closeCart}
              style={primaryBtn()}
            >
              {t.continueShopping}
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px" }}>
              {items.map((i) => (
                <div
                  key={i.productId}
                  style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--border)" }}
                >
                  <div style={{ width: 60, height: 60, flex: "none" }}>
                    <Media src={i.image} alt={i.name} radius={9} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>
                      {i.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid var(--border-strong)",
                          borderRadius: 7,
                          overflow: "hidden",
                        }}
                      >
                        <button type="button" onClick={() => updateQty(i.productId, i.quantity - 1)} style={qtyBtn()}>
                          −
                        </button>
                        <span className="sf-mono" style={{ fontSize: 13, fontWeight: 600, minWidth: 26, textAlign: "center" }}>
                          {i.quantity}
                        </span>
                        <button type="button" onClick={() => updateQty(i.productId, i.quantity + 1)} style={qtyBtn()}>
                          +
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="sf-mono" style={{ fontSize: 13.5, fontWeight: 700 }}>
                          {money(i.price * i.quantity, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(i.productId)}
                          aria-label={t.remove}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--faint)", display: "flex" }}
                        >
                          <Icon name="close" size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px" }}>
              <Row label={t.subtotal} value={money(subtotal, currency)} />
              <Row label={t.shipping} value={shipping === 0 ? t.free : money(shipping, currency)} muted />
              <button type="button" onClick={goCheckout} style={{ ...primaryBtn(), width: "100%", marginTop: 6 }}>
                {t.proceed} · {money(total, currency)}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        color: "var(--muted)",
        marginBottom: muted ? 12 : 5,
      }}
    >
      <span>{label}</span>
      <span className="sf-mono">{value}</span>
    </div>
  );
}

function primaryBtn(): React.CSSProperties {
  return {
    background: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    padding: "12px 22px",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function qtyBtn(): React.CSSProperties {
  return {
    background: "var(--surface)",
    color: "var(--text)",
    border: "none",
    width: 28,
    height: 28,
    fontSize: 15,
    cursor: "pointer",
  };
}
