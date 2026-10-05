"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { AskAboutButton } from "@/components/storefront/ask-about-button";
import type { ProductBuy } from "@/components/storefront/product-detail/use-product-buy";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";
import { OrdersPausedNotice } from "@/components/storefront/orders-paused-notice";
import type { OrdersPaused } from "@/lib/storefront-orders-paused";
import { brandButton, buttonMetrics } from "@/lib/storefront-button";

/*
 * The buy controls — variant chips, quantity stepper and the action row — on the
 * product page and in a landing page's Single product section, as three pieces
 * the product column places one by one (`ProductPartView`, in the order of
 * `product-main`'s parts).
 *
 * Paused orders, or a variable product with no purchasable variants, put one
 * card where the buttons go (`buyStopCard`) and the options and quantity draw
 * nothing — so a selector can never sit beside a card saying there is nothing
 * to select.
 */

/**
 * Whether the options and quantity have anything to act on. Exported so the
 * product column can leave their places out entirely — a wrapper around
 * nothing would still carry the order bar's scroll target.
 */
export const canChoose = (d: ProductBuy, paused: OrdersPaused | null): boolean =>
  !paused && !(d.variable && d.variants.length === 0);

/** The variant chips — nothing for a product with no options. */
export function ProductOptions({ d }: { d: ProductBuy }) {
  const paused = useOrdersPaused();
  if (!d.product || !d.variable || !canChoose(d, paused)) return null;
  return (
    <VariantSelector
      variants={d.variants}
      selection={d.selection}
      canBackorder={d.canBackorder}
      onSelect={(next) => {
        d.setPicked(next);
        d.setQty(1);
        d.setImgIdx(0);
      }}
    />
  );
}

/** The quantity stepper, capped at what is in stock unless the product backorders. */
export function ProductQuantity({ d }: { d: ProductBuy }) {
  const paused = useOrdersPaused();
  if (!d.product || !canChoose(d, paused)) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.t.quantity}</span>
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
  );
}

/** Add to cart, Buy now, ask-about and the wishlist heart — or the card that stands in for them. */
export function ProductBuyButtons({ d }: { d: ProductBuy }) {
  const { t, product, soldOut } = d;
  const paused = useOrdersPaused();
  if (!product) return null;
  const stop = buyStopCard(d, paused);
  if (stop) return stop;
  return (
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
  );
}

/**
 * The card that replaces the buying controls when they cannot be used, or
 * `null`. Paused orders come first: a variant or quantity picked for an order
 * that cannot be placed is a choice made for nothing.
 */
function buyStopCard(d: ProductBuy, paused: OrdersPaused | null): ReactNode {
  if (paused) {
    return (
      <div style={{ marginBottom: 20 }}>
        <OrdersPausedNotice paused={paused} />
      </div>
    );
  }
  if (!d.variable || d.variants.length > 0) return null;
  const { t, store } = d;
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
  ...brandButton({ radius: 9, padding: "14px 22px", fontSize: 14.5 }),
  flex: 1,
  minWidth: 150,
  border: "none",
  fontFamily: "inherit",
  fontWeight: 700,
};

const secondaryBtn: CSSProperties = {
  ...buttonMetrics({ radius: 9, padding: "14px 22px", fontSize: 14.5 }),
  flex: 1,
  minWidth: 130,
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  fontFamily: "inherit",
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
