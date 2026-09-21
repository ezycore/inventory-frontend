// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { PickGrid } from "@/components/storefront/home/pick-grid";
import { SectionLink } from "@/components/storefront-builder/section-link";
import { productRowHeading } from "@/components/storefront-builder/product-row-heading";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["selected-products"]["settings"];

/**
 * A short, bare edit of products — photo, name, price: the home page's minimal
 * picks as a section, in its narrower column and with its own heading row. The
 * spec caps it at six; a page wanting more wants a product grid. Photos follow
 * the store's product-card fit and ratio unless the section sets its own.
 */
export function SelectedProductsSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;
  const media = sectionCardMedia(settings);
  const { heading, subheading, linkLabel, linkHref } = productRowHeading(settings, context, "selected");
  const link =
    linkLabel && linkHref ? (
      <SectionLink base={context.base} href={linkHref} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
        {linkLabel} →
      </SectionLink>
    ) : null;
  return (
    // The home page's 980px column, measured the way its own box was: padding inside it.
    <div className="sfb-own-column" style={{ "--sfb-own-column": "calc(980px - 2 * var(--pad))" } as CSSProperties}>
      {heading || link ? (
        // Its own baseline and 28px gap are the classic picks row's, kept so a
        // migrated home is unchanged; only the alignment is shared with
        // `SectionTitle`, through `.sfb-title-row`.
        <div className="sfb-title-row" style={{ display: "flex", alignItems: "baseline", marginBottom: 28 }}>
          {heading ? (
            <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{heading}</h2>
          ) : (
            <span />
          )}
          {link}
        </div>
      ) : null}
      <PickGrid
        products={products}
        base={context.base}
        currency={context.currency}
        imageFit={media.imageFit ?? context.imageFit ?? "cover"}
        imageRatio={media.imageRatio ?? context.imageRatio ?? "1 / 1"}
      />
    </div>
  );
}
