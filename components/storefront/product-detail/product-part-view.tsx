"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { ProductTagChips } from "@/components/storefront/product-tag-chips";
import { PromiseRows } from "@/components/storefront/home/promise-rows";
import {
  canChoose,
  ProductBuyButtons,
  ProductOptions,
  ProductQuantity,
} from "@/components/storefront/product-detail/product-buy-panel";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";
import { BUY_PANEL_ANCHOR } from "@/components/storefront-builder/order-form-anchor";
import type { ProductBuy } from "@/components/storefront/product-detail/use-product-buy";
import type { ProductPart } from "@/lib/storefront-builder/product-parts";
import { deliveryEstimateSummary } from "@/lib/storefront-delivery";
import {
  descriptionText,
  descriptionWrap,
  isLongDescription,
  ProductDescriptionView,
} from "@/components/storefront/product-description-view";

/**
 * One part of the product page's column beside the photos — see
 * `lib/storefront-builder/product-parts.ts` for which parts there are and the
 * order they come in.
 *
 * Each part keeps the markup it had when the column was fixed, so a page with no
 * parts saved draws what it always drew. A part with nothing to show — no tags,
 * a long description, no promises written — draws nothing rather than an empty
 * band.
 */
export function ProductPartView({
  part,
  d,
  heading: Heading,
  showDescription,
  promises,
  last,
}: {
  part: ProductPart;
  d: ProductBuy;
  heading: "h1" | "h2";
  /** `false` when the section hides the product's own words on every product. */
  showDescription: boolean;
  /** The store's promises, for the promises part. */
  promises?: readonly { text: string; icon?: string }[];
  /** The column's last part, which needs no space below it. */
  last: boolean;
}) {
  const { t, base, product } = d;
  const paused = useOrdersPaused();
  if (!product) return null;
  const drawn = (() => {
    switch (part.part) {
      case "name":
        return <Heading style={headingStyle}>{product.name}</Heading>;
      case "badges":
        // Stock state and the merchant's labels share one row directly under the
        // title — the labels are what the merchant is merchandising on, so
        // burying them below the fold would make the tags page look like it does
        // nothing. Two states, not three: a backorder product reads exactly like
        // an in-stock one, since `soldOut` already excludes it.
        return (
          <div style={badgeRow}>
            <span
              style={{
                ...stockBadge,
                color: d.soldOut ? "var(--discount)" : "var(--primary)",
                background: d.soldOut ? "var(--discount-soft)" : "var(--primary-soft)",
              }}
            >
              {d.soldOut ? t.outOfStock : t.inStock}
            </span>
            {/* Each chip links into the tag facet — a chip that only decorates is a wasted exit. */}
            <ProductTagChips tags={product.tags} base={base} />
          </div>
        );
      case "price":
        return (
          <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginBottom: 18 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{money(d.price, d.currency)}</span>
            {d.hasOld ? (
              <span style={{ fontSize: 15, color: "var(--faint)", textDecoration: "line-through" }}>
                {money(d.compareAt, d.currency)}
              </span>
            ) : null}
          </div>
        );
      case "summary":
        // A SHORT, plain description only. A long or structured one renders in
        // its own block below the photos (`ProductLongDescription`), never here:
        // a body that can carry a size-chart table would push Add to cart off a
        // phone screen, which is the one thing this column exists to show.
        return showDescription && product.description && !isLongDescription(product.description) ? (
          <div style={descriptionWrap}>
            <ProductDescriptionView description={product.description} legacyStyle={descriptionText} />
          </div>
        ) : null;
      case "options":
        return d.variable && canChoose(d, paused) ? <ProductOptions d={d} /> : null;
      case "quantity":
        return canChoose(d, paused) ? <ProductQuantity d={d} /> : null;
      case "buy":
        return <ProductBuyButtons d={d} />;
      case "delivery":
        return (
          <div style={{ ...deliveryRow, marginBottom: last ? 0 : 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--muted)" }}>
              <Icon name="truck" size={18} />{" "}
              {deliveryEstimateSummary(d.store, {
                insideDhaka: t.insideDhaka,
                outsideDhaka: t.outsideDhaka,
                fallback: t.deliveryOptionsCheckout,
              })}
            </div>
          </div>
        );
      case "promises":
        return promises?.length ? (
          <PromiseRows promises={promises} iconStyle="plain" className="sf-pdp-promises" style={{ marginBottom: 20 }} />
        ) : null;
      case "text":
        return part.text ? (
          <div style={descriptionWrap}>
            <ProductDescriptionView description={part.text} legacyStyle={descriptionText} />
          </div>
        ) : null;
      case "collapsible":
        // A native disclosure: it opens without script, and a screen reader
        // already knows what it is.
        return part.title ? (
          <details className="sf-pdp-fold" open={part.open === true}>
            <summary>{part.title}</summary>
            {part.text ? (
              <div className="sf-pdp-fold-body">
                <ProductDescriptionView description={part.text} legacyStyle={descriptionText} />
              </div>
            ) : null}
          </details>
        ) : null;
    }
  })();
  // Every buying part that draws carries the scroll target the sticky order bar
  // jumps back to; the bar takes the first in the page, so it lands on whichever
  // of them the merchant put highest — never past the options.
  if (!drawn || !BUYING.has(part.part)) return drawn;
  return <div {...{ [BUY_PANEL_ANCHOR]: "" }}>{drawn}</div>;
}

const BUYING = new Set<ProductPart["part"]>(["options", "quantity", "buy"]);

const headingStyle: CSSProperties = {
  fontSize: "clamp(22px,3vw,30px)",
  fontWeight: 700,
  margin: "0 0 10px",
  letterSpacing: "-0.025em",
  lineHeight: 1.15,
};

const badgeRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 16,
};

const stockBadge: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: 999,
};

const deliveryRow: CSSProperties = {
  borderTop: "1px solid var(--border)",
  paddingTop: 16,
  display: "flex",
  flexDirection: "column",
  gap: 9,
};
