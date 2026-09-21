"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { discountPct, money } from "@/components/storefront/format";
import { listingSoldOut } from "@/components/storefront/product-choice";

/**
 * The price block of an Offer & pricing section: the product's name, its price
 * ("From" for a variable product, whose listed price is its cheapest option),
 * the struck original and the discount, and "Out of stock" when it has sold out.
 *
 * Rows are inline so they follow the section's alignment. Loaded only through
 * the island map.
 */
export function OfferPriceIsland({
  product,
  currency,
}: {
  product: CatalogProduct;
  currency?: string;
}) {
  const { t } = useStorefrontUI();
  const pct = discountPct(product.price, product.compareAtPrice);
  const soldOut = listingSoldOut(product);

  return (
    <div>
      <div style={name}>{product.name}</div>
      <div style={row}>
        {product.productType === "variable" ? <span style={from}>{t.fromPrice}</span> : null}
        <span style={price}>{money(product.price, currency)}</span>
        {pct > 0 ? <span style={was}>{money(product.compareAtPrice, currency)}</span> : null}
      </div>
      {pct > 0 || soldOut ? (
        <div>
          <div style={{ ...row, marginTop: 12 }}>
            {pct > 0 ? (
              <span style={{ ...tag, color: "var(--primary)", background: "var(--primary-soft)" }}>
                {pct}% {t.campaignOff}
              </span>
            ) : null}
            {soldOut ? (
              <span style={{ ...tag, color: "var(--discount)", background: "var(--discount-soft)" }}>
                {t.outOfStock}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const name: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 6,
};

const row: CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  flexWrap: "wrap",
  gap: "4px 12px",
};

const from: CSSProperties = { fontSize: 15, color: "var(--muted)" };

const price: CSSProperties = {
  fontSize: "clamp(34px, 6vw, 48px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};

const was: CSSProperties = {
  fontSize: "clamp(17px, 2.4vw, 22px)",
  color: "var(--faint)",
  textDecoration: "line-through",
  whiteSpace: "nowrap",
};

const tag: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  padding: "5px 12px",
  borderRadius: 999,
};
