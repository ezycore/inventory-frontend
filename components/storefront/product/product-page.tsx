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
import { responsiveClasses, responsiveVars } from "@/lib/storefront-builder/responsive";
import type { Responsive } from "@/lib/storefront-builder/settings";
import { sectionCardLook, type CardLookSettings } from "@/lib/storefront-builder/card-media";
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
/**
 * What the `product-main` section says about this page's photos and its related
 * row. Every field is optional and every absent one means "the store's own
 * choice", so the classic product page — which passes nothing at all — renders
 * byte-for-byte as it did.
 *
 * The shape travels as CSS custom properties rather than as a rendered value,
 * because it differs per screen and one HTML is served to both (the same reason
 * the checkout's coupon control is two classes). The fit does not: it picks
 * between two whole renderings of the photo inside `Media`, which no stylesheet
 * can switch.
 */
export interface ProductShape {
  /** The big photo's fit. */
  imageFit?: "cover" | "canvas";
  /** The big photo's frame per screen, already as CSS `aspect-ratio` values. */
  imageRatio?: Responsive<string>;
  /** How many cards the built-in "You may also like" row shows. */
  relatedLimit?: number;
  /** How many of them sit on a line, per screen. */
  relatedColumns?: Responsive<number>;
  /** The related CARDS' photo — the pair every other product row carries. */
  cardImageFit?: "cover" | "canvas";
  cardImageRatio?: string;
  /**
   * The related cards' corners and button fill.
   *
   * ⚠ Applied to the ROW, not to the page. The section could spread these
   * attributes on its own `.sfb-core` wrapper in one line — but they redefine
   * `--radius-md` and the `--btn-*` group for everything inside, and a control
   * the editor calls "Related card corners" must not round the first element
   * someone later adds to the product page.
   */
  cardLook?: CardLookSettings;
}

export function ProductPageView({
  initialProduct,
  hideRelated = false,
  hideDescription = false,
  layout,
  shape,
}: {
  initialProduct?: CatalogProduct;
  /** Leave out "You may also like" — a builder page placing a Related products section instead. */
  hideRelated?: boolean;
  /** Leave out the product's own words, for a page that tells them in its own sections. */
  hideDescription?: boolean;
  /** The `product-main` section's own layout; unset follows the store's template. */
  layout?: string;
  /** That section's photo and related-row settings; unset everywhere else. */
  shape?: ProductShape;
}) {
  const d = useProductDetail(initialProduct, layout, shape?.relatedLimit);
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
    <div
      style={{ ...wrap, ...responsiveVars("sfb-pdp-frame", shape?.imageRatio) }}
      /* `.sfb-pdp` is what turns those two variables into the one the gallery
         reads, per screen — the class is emitted only with a shape to carry, so
         a page that sets none keeps the store's. */
      className={shape?.imageRatio ? "sfb-pdp" : undefined}
    >
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

      <ProductOverview
        d={d}
        galleryTop={d.galleryTop}
        showDescription={!hideDescription}
        imageFit={shape?.imageFit}
      />

      {/* The `id` stays for deep links from outside (a campaign post pointing at
          the size chart). */}
      {hideDescription ? null : <ProductLongDescription d={d} id="description" />}

      {!hideRelated && d.related.length > 0 ? (
        <div style={{ marginTop: 44 }}>
          <SectionTitle>{t.relatedTitle}</SectionTitle>
          {/* `sf-grid-4` stays on the row whatever the merchant chose — it is
              what makes this a grid at all. The column classes only redirect the
              count it reads, per screen, and are absent without a choice. */}
          <div
            className={relatedGridClass(shape?.relatedColumns)}
            style={responsiveVars("sfb-cols", shape?.relatedColumns)}
            {...sectionCardLook(shape?.cardLook ?? {})}
          >
            {d.related.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                currency={d.currency}
                variant="compact"
                imageFit={shape?.cardImageFit}
                imageRatio={shape?.cardImageRatio}
              />
            ))}
          </div>
        </div>
      ) : null}

      <ProductStickyBar d={d} />
    </div>
  );
}

/** The related row's classes: the storefront's grid, plus the screens the merchant answered for. */
function relatedGridClass(columns?: Responsive<number>): string {
  const own = responsiveClasses("sfb-cols", columns);
  return own ? `sf-grid-4 ${own}` : "sf-grid-4";
}
