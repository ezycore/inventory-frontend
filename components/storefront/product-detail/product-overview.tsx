"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductTagChips } from "@/components/storefront/product-tag-chips";
import { ProductBuyPanel } from "@/components/storefront/product-detail/product-buy-panel";
import { BUY_PANEL_ANCHOR } from "@/components/storefront-builder/order-form-anchor";
import type { ProductBuy } from "@/components/storefront/product-detail/use-product-buy";
import { deliveryEstimateSummary } from "@/lib/storefront-delivery";
import {
  isLongDescription,
  ProductDescriptionView,
} from "@/components/storefront/product-description-view";

/**
 * A product's photos beside (or above) its name, stock, price, short
 * description, buy controls and delivery estimate — the top of the product
 * page, and a landing page's Single product section.
 *
 * `heading` is the product name's level: `h1` on the product page, `h2` in a
 * section, whose page has its own. `pending` holds the price and buy controls
 * back while a variable product's options load: a listing row carries no
 * variants, so its price alone would read 0 beside a call-to-order card.
 */
export function ProductOverview({
  d,
  galleryTop,
  heading: Heading = "h1",
  showDescription = true,
  pending = false,
}: {
  d: ProductBuy;
  galleryTop: boolean;
  heading?: "h1" | "h2";
  showDescription?: boolean;
  pending?: boolean;
}) {
  const { t, base, product } = d;
  if (!product) return null;
  const descriptionIsLong = isLongDescription(product.description);
  const deliveryEstimate = deliveryEstimateSummary(d.store, {
    insideDhaka: t.insideDhaka,
    outsideDhaka: t.outsideDhaka,
    fallback: t.deliveryOptionsCheckout,
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: galleryTop ? "1fr" : "var(--pdpgrid)",
        gap: "clamp(22px,3vw,44px)",
        alignItems: "start",
      }}
    >
      <ProductGallery
        images={d.images}
        alt={product.name}
        layout={galleryTop ? "top" : "side"}
        index={d.imgIdx}
        onSelect={d.setImgIdx}
      />

      {/* Info */}
      <div>
        <Heading style={headingStyle}>{product.name}</Heading>

        {pending ? (
          <div style={{ minHeight: 240 }} />
        ) : (
          <>
            {/* Stock state and the merchant's labels share one badge row directly
                under the title — the labels are what the merchant is merchandising
                on ("Eid sale", "Organic"), so burying them below the fold would
                make the tags page look like it does nothing. Wraps, because a
                product can carry several and the column is narrow on a phone.

                Two states, not three: a BACKORDER product reads exactly like an
                ordinary in-stock one. It used to say "Available on backorder",
                which asked the shopper to understand a fulfilment arrangement
                that is the merchant's to manage — they order as usual, the
                merchant restocks and then confirms. `soldOut` already excludes
                backorder, so the branch simply goes. */}
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
              {/* Each chip is a link into the tag facet, so a shopper who likes a
                  label can see the rest of it — a chip that only decorates is a
                  wasted exit. */}
              <ProductTagChips tags={product.tags} base={base} />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginBottom: 18 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {money(d.price, d.currency)}
              </span>
              {d.hasOld ? (
                <span style={{ fontSize: 15, color: "var(--faint)", textDecoration: "line-through" }}>
                  {money(d.compareAt, d.currency)}
                </span>
              ) : null}
            </div>

            {/* A SHORT, plain description stays here, where it always was. A long
                or structured one renders ONLY in its own block below the purchase
                block (`ProductLongDescription`) — nothing stands in for it here. A
                body that can carry headings and a size-chart table would otherwise
                push Add to Cart off a phone screen, which is the one thing this
                column exists to show, and a teaser plus a jump link was just a
                second thing to read before reaching the button. */}
            {showDescription && product.description && !descriptionIsLong ? (
              <div style={descriptionWrap}>
                <ProductDescriptionView description={product.description} legacyStyle={description} />
              </div>
            ) : null}

            <div {...{ [BUY_PANEL_ANCHOR]: "" }}>
              <ProductBuyPanel d={d} />
            </div>

            <div style={deliveryRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--muted)" }}>
                <Icon name="truck" size={18} /> {deliveryEstimate}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A long or structured description, in its own block below the purchase block —
 * the ONLY place one renders. `id` is the product page's deep-link target (a
 * campaign post pointing at the size chart); `scrollMarginTop` keeps the heading
 * clear of the sticky header when one lands here.
 */
export function ProductLongDescription({ d, id }: { d: ProductBuy; id?: string }) {
  const { t, product } = d;
  if (!product || !isLongDescription(product.description)) return null;
  return (
    <div id={id} style={{ marginTop: 44, scrollMarginTop: 88 }}>
      <SectionTitle>{t.description}</SectionTitle>
      <div style={descriptionWrap}>
        <ProductDescriptionView description={product.description} legacyStyle={description} />
      </div>
    </div>
  );
}

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

// Legacy plain-text branch only — `ProductDescriptionView` applies it to the
// bare <p> so an un-migrated description looks exactly as it did before.
const description: CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-line",
};

// Owns the spacing for BOTH branches, so a rich body and a legacy paragraph sit
// the same distance off the buy panel.
const descriptionWrap: CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.6,
  marginBottom: 20,
};

const deliveryRow: CSSProperties = {
  borderTop: "1px solid var(--border)",
  paddingTop: 16,
  display: "flex",
  flexDirection: "column",
  gap: 9,
};
