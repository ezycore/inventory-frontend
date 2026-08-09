"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { AskAboutButton } from "@/components/storefront/ask-about-button";
import type { ProductDetail } from "@/components/storefront/product-detail/use-product-detail";

/**
 * The buy controls: variant chips, quantity stepper, and the action row.
 *
 * A variable product with no purchasable variants falls back to the
 * call-to-order card instead of an empty selector — that branch lives here
 * rather than in the page because it *replaces* this whole panel, and splitting
 * the two apart is what would let a future edit render both.
 */
export function ProductBuyPanel({ d }: { d: ProductDetail }) {
  const { t, store, product, variable, variants, soldOut } = d;
  if (!product) return null;

  if (variable && variants.length === 0) {
    return (
      <div style={callCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
          <Icon name="mapPin" size={17} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{t.variableTitle}</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
          {t.variableMsg}
        </p>
        {store?.contact?.phone ? (
          <a href={`tel:${store.contact.phone}`} style={callLink}>
            <Icon name="phone" size={15} /> {t.callToOrder} · {store.contact.phone}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {variable ? (
        <VariantSelector
          variants={variants}
          selection={d.selection}
          onSelect={(next) => {
            d.setPicked(next);
            d.setQty(1);
            d.setImgIdx(0);
          }}
        />
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{t.quantity}</span>
        <div style={stepper}>
          <button type="button" onClick={() => d.setQty((q) => Math.max(1, q - 1))} style={qtyBtn}>
            −
          </button>
          <span
            className="sf-mono"
            style={{ fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: "center" }}
          >
            {d.qty}
          </span>
          <button
            type="button"
            onClick={() =>
              d.setQty((q) =>
                !d.canBackorder && d.availableQty > 0
                  ? Math.min(d.availableQty, q + 1)
                  : q + 1,
              )
            }
            style={qtyBtn}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 11, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => d.add()}
          style={{ ...primaryBtn, ...disabledIf(soldOut) }}
        >
          {soldOut ? t.outOfStock : t.addToCartFull}
        </button>
        <button
          type="button"
          disabled={soldOut}
          onClick={d.buyNow}
          style={{ ...secondaryBtn, ...disabledIf(soldOut) }}
        >
          {t.buyNow}
        </button>
        {/* Higher-intent than the floating launcher: the message names THIS
            product. Renders nothing unless the merchant enabled the contact
            button — and it is also what publishes the product context, so the
            floating launcher on this page sends the same sentence. */}
        <AskAboutButton
          productName={product.name}
          variantLabel={d.selectedVariant?.label}
          price={d.price}
          currency={d.currency}
        />
        {/* Wishlist heart — saved items appear in Account → Wishlist. */}
        <button
          type="button"
          onClick={d.onWish}
          aria-label={t.tabWishlist}
          aria-pressed={d.wished}
          style={{
            ...wishBtn,
            background: d.wished ? "var(--primary-soft)" : "transparent",
            color: d.wished ? "var(--primary)" : "var(--muted)",
          }}
        >
          <Icon name={d.wished ? "heartFill" : "heart"} size={20} />
        </button>
      </div>
    </div>
  );
}

const disabledIf = (off: boolean): CSSProperties => ({
  cursor: off ? "not-allowed" : "pointer",
  opacity: off ? 0.55 : 1,
});

const callCard: CSSProperties = {
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  borderRadius: 12,
  padding: 18,
  marginBottom: 20,
};

const callLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--text)",
  color: "var(--card)",
  padding: "11px 18px",
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
};

const stepper: CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  overflow: "hidden",
};

const qtyBtn: CSSProperties = {
  background: "var(--surface)",
  color: "var(--text)",
  border: "none",
  width: 44,
  height: 44,
  fontSize: 17,
  cursor: "pointer",
};

const primaryBtn: CSSProperties = {
  flex: 1,
  minWidth: 150,
  background: "var(--primary)",
  color: "var(--on-primary)",
  border: "none",
  padding: "14px 22px",
  borderRadius: 9,
  fontFamily: "inherit",
  fontSize: 14.5,
  fontWeight: 700,
};

const secondaryBtn: CSSProperties = {
  flex: 1,
  minWidth: 130,
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  padding: "14px 22px",
  borderRadius: 9,
  fontFamily: "inherit",
  fontSize: 14.5,
  fontWeight: 600,
};

const wishBtn: CSSProperties = {
  flex: "none",
  width: 52,
  border: "1px solid var(--border-strong)",
  padding: 14,
  borderRadius: 9,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
