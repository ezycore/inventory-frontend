"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import { useStore } from "@/services/storefront/hooks";
import { cartLineKey, useCartStore } from "@/services/stores/use-cart-store";
import { useCartUI } from "@/services/stores/use-cart-ui-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { computeShipping } from "@/lib/storefront-shipping";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { SideDrawer } from "@/components/storefront/side-drawer";

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

  // The drawer IS the add-to-cart confirmation — clear any in-flight "Added"
  // toast so it can't double-speak (or cover the footer CTAs) over the drawer.
  useEffect(() => {
    if (open) toast.dismiss();
  }, [open]);

  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  // No early return on !open — SideDrawer stays mounted through its exit
  // animation and unmounts itself.
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
  const goCartPage = () => {
    closeCart();
    router.push(storeHref(base, "/cart"));
  };

  return (
    <SideDrawer
      open={open}
      onClose={closeCart}
      side="right"
      title={
        <>
          {t.yourCart}{" "}
          <span style={{ color: "var(--muted)", fontWeight: 500 }}>({count})</span>
        </>
      }
      footer={
        items.length > 0 ? (
          <>
            <Row label={t.subtotal} value={money(subtotal, currency)} />
            <Row
              label={t.shipping}
              value={shipping === 0 ? t.free : money(shipping, currency)}
              muted
            />
            <button
              type="button"
              onClick={goCheckout}
              style={{ ...primaryBtn(), width: "100%", marginTop: 6 }}
            >
              {t.proceed} · {money(total, currency)}
            </button>
            {/* Full cart page for editing at leisure — the drawer stays the quick path. */}
            <button
              type="button"
              onClick={goCartPage}
              style={{
                width: "100%",
                marginTop: 8,
                background: "transparent",
                color: "var(--text)",
                border: "1px solid var(--border-strong)",
                padding: "11px 22px",
                borderRadius: 8,
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.viewCart}
            </button>
          </>
        ) : undefined
      }
    >
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
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px" }}>
              {items.map((i) => (
                <div
                  key={cartLineKey(i)}
                  style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--border)" }}
                >
                  <div style={{ width: 60, height: 60, flex: "none" }}>
                    <Media src={i.image} alt={i.name} radius={9} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>
                      {i.name}
                      {i.variantLabel ? (
                        <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {i.variantLabel}</span>
                      ) : null}
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
                        <button type="button" onClick={() => updateQty(cartLineKey(i), i.quantity - 1)} style={qtyBtn()}>
                          −
                        </button>
                        <span className="sf-mono" style={{ fontSize: 13, fontWeight: 600, minWidth: 26, textAlign: "center" }}>
                          {i.quantity}
                        </span>
                        <button type="button" onClick={() => updateQty(cartLineKey(i), i.quantity + 1)} style={qtyBtn()}>
                          +
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="sf-mono" style={{ fontSize: 13.5, fontWeight: 700 }}>
                          {money(i.price * i.quantity, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(cartLineKey(i))}
                          aria-label={t.remove}
                          style={removeBtn}
                        >
                          <Icon name="close" size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
    </SideDrawer>
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
    width: 38,
    height: 38,
    fontSize: 15,
    cursor: "pointer",
  };
}

/** Padding (not a size) grows the 15px glyph to a 39px touch target in place. */
const removeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--faint)",
  display: "flex",
  padding: 12,
  margin: -12,
};
