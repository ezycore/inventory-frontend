"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { productCrumbs } from "@/lib/storefront-breadcrumb";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import { useProductDetail } from "@/components/storefront/product-detail/use-product-detail";
import {
  ProductLongDescription,
  ProductOverview,
} from "@/components/storefront/product-detail/product-overview";
import { ProductStickyBar } from "@/components/storefront/product-detail/product-sticky-bar";
import type { CatalogProduct } from "@/lib/storefront-client";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

/**
 * Product detail page — composition only. The queries, the shopper's selection
 * and the three actions live in `useProductDetail`; the photos, buy controls and
 * the sticky bar are their own components.
 *
 * `initialProduct` is server-fetched in `page.tsx` so this page's content is in
 * the SSR HTML — see the note there.
 */
export function ProductPageView({
  initialProduct,
}: {
  initialProduct?: CatalogProduct;
}) {
  const d = useProductDetail(initialProduct);
  const { t, base, product } = d;

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

      <ProductOverview d={d} galleryTop={d.galleryTop} />

      {/* The `id` stays for deep links from outside (a campaign post pointing at
          the size chart). */}
      <ProductLongDescription d={d} id="description" />

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
