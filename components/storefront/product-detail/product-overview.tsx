"use client";
// coding-standard: maintained

import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductGallery } from "@/components/storefront/product-gallery";
import type { ProductBuy } from "@/components/storefront/product-detail/use-product-buy";
import { ProductPartView } from "@/components/storefront/product-detail/product-part-view";
import { partTargets, productParts, type ProductPart } from "@/lib/storefront-builder/product-parts";
import { showsOnProduct } from "@/lib/storefront-builder/product-targets";
import {
  descriptionText,
  descriptionWrap,
  isLongDescription,
  ProductDescriptionView,
} from "@/components/storefront/product-description-view";

/**
 * A product's photos beside (or above) its name, stock, price, short
 * description, buy controls and delivery estimate — the top of the product
 * page, and a landing page's Single product section.
 *
 * The column beside the photos is a list of parts (`ProductPartView`), in the
 * order the product page's section stores them; without `parts` it is the
 * column every product page always drew, which is also what Single product
 * draws. A text or collapsible part limited to some products (`partTargets`)
 * is left out on every other product before the column is laid out, so the
 * last part drawn is still the one that loses its bottom space.
 *
 * `heading` is the product name's level: `h1` on the product page, `h2` in a
 * section, whose page has its own. `pending` holds the price and buy controls
 * back while a variable product's options load: a listing row carries no
 * variants, so its price alone would read 0 beside a call-to-order card.
 */
export function ProductOverview({
  d,
  galleryTop,
  heading = "h1",
  showDescription = true,
  pending = false,
  imageFit,
  parts,
  promises,
}: {
  d: ProductBuy;
  galleryTop: boolean;
  heading?: "h1" | "h2";
  showDescription?: boolean;
  pending?: boolean;
  /** The product page section's own photo fit; unset follows the store. */
  imageFit?: "cover" | "canvas";
  /** The column's parts, in order (`productParts`); unset is the column as it always was. */
  parts?: readonly ProductPart[];
  /** The store's promises, for a promises part. */
  promises?: readonly { text: string; icon?: string }[];
}) {
  const { product } = d;
  if (!product) return null;
  const shown = pending
    ? NAME_ONLY
    : (parts ?? DEFAULT_PARTS).filter((part) => showsOnProduct(partTargets(part), product));

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
        imageFit={imageFit}
      />

      {/* Info */}
      <div>
        {shown.map((part, index) => (
          <ProductPartView
            key={part.key}
            part={part}
            d={d}
            heading={heading}
            showDescription={showDescription}
            promises={promises}
            last={index === shown.length - 1}
          />
        ))}
        {pending ? <div style={{ minHeight: 240 }} /> : null}
      </div>
    </div>
  );
}

const DEFAULT_PARTS = productParts();
const NAME_ONLY: readonly ProductPart[] = [{ key: "name", part: "name" }];

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
        <ProductDescriptionView description={product.description} legacyStyle={descriptionText} />
      </div>
    </div>
  );
}
