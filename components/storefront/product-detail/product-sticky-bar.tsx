"use client";
// coding-standard: maintained

import { useRef, type CSSProperties } from "react";
import { money } from "@/components/storefront/format";
import { useBuybarHeight } from "@/components/storefront/use-buybar-height";
import type { ProductDetail } from "@/components/storefront/product-detail/use-product-detail";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";

/**
 * The "sticky bar" product template's bottom bar — name, price, Add to cart —
 * pinned above the mobile tab bar as the shopper scrolls.
 *
 * ⚠️ **It publishes its own height as `--sf-buybar-h`, and must keep doing so.**
 * The floating contact launcher anchors above this bar; without the measurement
 * the variable stays 0 and the launcher lands squarely on the Add-to-cart button
 * on every mobile product page — while still looking correct on the home page,
 * on desktop, and in every screenshot taken while building it.
 *
 * The ref is created here rather than handed down from `useProductDetail`
 * because a ref read off a shared object during render is exactly what the
 * `react-hooks/refs` rule rejects — and because the component that renders the
 * bar is the one that should own measuring it.
 */
export function ProductStickyBar({ d }: { d: ProductDetail }) {
  const { t, product, selectedVariant, soldOut } = d;
  const ref = useRef<HTMLDivElement>(null);

  // A variable product with no purchasable variants shows the call-to-order
  // card instead of buy controls, so a buy bar under it would be a dead button.
  // Nor while orders are paused: the notice in the buy panel is the only answer.
  const paused = useOrdersPaused();
  const show = !paused && !!product && d.sticky && !(d.variable && d.variants.length === 0);
  // Called before the early return, so the hook order stays unconditional — and
  // so `--sf-buybar-h` is reset to 0 on the layouts that render no bar.
  useBuybarHeight(ref, show);

  if (!show || !product) return null;

  return (
    <div ref={ref} style={bar}>
      <div style={{ minWidth: 0 }}>
        <div style={title}>
          {product.name}
          {selectedVariant ? ` — ${selectedVariant.label}` : ""}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{money(d.price, d.currency)}</div>
      </div>
      <button
        type="button"
        disabled={soldOut}
        onClick={() => d.add()}
        style={{
          ...cta,
          cursor: soldOut ? "not-allowed" : "pointer",
          opacity: soldOut ? 0.55 : 1,
        }}
      >
        {soldOut ? t.outOfStock : t.addToCartFull}
      </button>
    </div>
  );
}

const bar: CSSProperties = {
  position: "sticky",
  bottom: "calc(var(--sf-bottom-nav-h, 0px) + var(--sf-ownerbar-h, 0px))",
  margin: "28px calc(-1 * var(--pad)) -40px",
  background: "var(--card)",
  borderTop: "1px solid var(--border)",
  padding: "12px var(--pad)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  boxShadow: "0 -8px 24px -16px rgba(0,0,0,0.3)",
};

const title: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cta: CSSProperties = {
  flex: "none",
  background: "var(--primary)",
  color: "var(--on-primary)",
  border: "none",
  padding: "13px 26px",
  borderRadius: 9,
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 700,
};
