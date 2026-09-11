"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductTagChips } from "@/components/storefront/product-tag-chips";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { productCrumbs } from "@/lib/storefront-breadcrumb";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import { useProductDetail } from "@/components/storefront/product-detail/use-product-detail";
import { ProductBuyPanel } from "@/components/storefront/product-detail/product-buy-panel";
import { ProductStickyBar } from "@/components/storefront/product-detail/product-sticky-bar";
import type { CatalogProduct } from "@/lib/storefront-client";
import { deliveryEstimateSummary } from "@/lib/storefront-delivery";
import {
  isLongDescription,
  ProductDescriptionView,
} from "@/components/storefront/product-description-view";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

/**
 * Product detail page — composition only. The queries, the shopper's selection
 * and the three actions live in `useProductDetail`; the buy controls and the
 * sticky bar are their own components.
 *
 * `initialProduct` is server-fetched in `page.tsx` so this page's content is in
 * the SSR HTML — see the note there.
 */
export default function ProductDetailPage({
  initialProduct,
}: {
  initialProduct?: CatalogProduct;
}) {
  const d = useProductDetail(initialProduct);
  const { t, base, product } = d;
  const descriptionIsLong = isLongDescription(product?.description);
  const deliveryEstimate = deliveryEstimateSummary(d.store, {
    insideDhaka: t.insideDhaka,
    outsideDhaka: t.outsideDhaka,
    fallback: t.deliveryOptionsCheckout,
  });

  if (d.isLoading) {
    return (
      <div style={wrap}>
        <LoadingSplash />
      </div>
    );
  }
  if (d.isError || !product) {
    return (
      <div style={wrap}>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
          {t.productNotFound}
        </p>
        <Link
          href={storeHref(base, "/products")}
          style={{ fontSize: 13, color: "var(--primary)" }}
        >
          ← {t.allProducts}
        </Link>
      </div>
    );
  }

  return (
    <div style={wrap}>
      {/* Same crumbs as the page's BreadcrumbList JSON-LD — one builder, so the
          visible trail and the structured data cannot disagree. */}
      <Breadcrumb
        base={base}
        crumbs={productCrumbs({
          storeName: d.store?.name ?? "",
          productName: product.name,
          productSlug: d.productSlug,
          categories: d.categories ?? [],
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          allProductsLabel: t.allProducts,
        })}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: d.galleryTop ? "1fr" : "var(--pdpgrid)",
          gap: "clamp(22px,3vw,44px)",
          alignItems: "start",
        }}
      >
        <ProductGallery
          images={d.images}
          alt={product.name}
          layout={d.galleryTop ? "top" : "side"}
          index={d.imgIdx}
          onSelect={d.setImgIdx}
        />

        {/* Info */}
        <div>
          <h1 style={heading}>{product.name}</h1>

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
              <span
                style={{ fontSize: 15, color: "var(--faint)", textDecoration: "line-through" }}
              >
                {money(d.compareAt, d.currency)}
              </span>
            ) : null}
          </div>

          {/* A SHORT, plain description stays here, where it always was. A long
              or structured one renders ONLY in its own section below the
              purchase block — nothing stands in for it here. A body that can
              carry headings and a size-chart table would otherwise push Add to
              Cart off a phone screen, which is the one thing this column exists
              to show, and a teaser plus a jump link was just a second thing to
              read before reaching the button. */}
          {product.description && !descriptionIsLong ? (
            <div style={descriptionWrap}>
              <ProductDescriptionView
                description={product.description}
                legacyStyle={description}
              />
            </div>
          ) : null}

          <ProductBuyPanel d={d} />

          <div style={deliveryRow}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              <Icon name="truck" size={18} /> {deliveryEstimate}
            </div>
          </div>
        </div>
      </div>

      {/* The full body, below the purchase block — the ONLY place a long
          description renders. The `id` stays for deep links from outside (a
          campaign post pointing at the size chart); `scrollMarginTop` keeps the
          heading clear of the sticky header when one lands here. */}
      {descriptionIsLong ? (
        <div id="description" style={{ marginTop: 44, scrollMarginTop: 88 }}>
          <SectionTitle>{t.description}</SectionTitle>
          <div style={descriptionWrap}>
            <ProductDescriptionView
              description={product.description}
              legacyStyle={description}
            />
          </div>
        </div>
      ) : null}

      {d.related.length > 0 ? (
        <div style={{ marginTop: 44 }}>
          <SectionTitle>{t.relatedTitle}</SectionTitle>
          <div className="sf-grid-4">
            {d.related.map((p) => (
              <ProductCard key={p._id} product={p} currency={d.currency} variant="compact" />
            ))}
          </div>
        </div>
      ) : null}

      <ProductStickyBar d={d} />
    </div>
  );
}

const heading: CSSProperties = {
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
