// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { PickGrid } from "@/components/storefront/home/pick-grid";
import { SectionLink } from "@/components/storefront-builder/section-link";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["selected-products"]["settings"];

/**
 * A short, bare edit of products — photo, name, price: the home page's minimal
 * picks as a section. The spec caps it at six; a page wanting more wants a
 * product grid.
 *
 * Photos follow the store's product-card fit and ratio. The link beside the
 * heading draws only when the merchant gave it both a label and a destination:
 * a builder section carries no platform wording ("View all") of its own.
 */
export function SelectedProductsSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;

  const cta =
    settings.ctaLabel && settings.ctaHref ? (
      <SectionLink
        base={context.base}
        href={settings.ctaHref}
        style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}
      >
        {settings.ctaLabel} →
      </SectionLink>
    ) : null;

  return (
    <>
      {settings.heading ? (
        <SectionTitle action={cta}>{settings.heading}</SectionTitle>
      ) : cta ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>{cta}</div>
      ) : null}
      <PickGrid
        products={products}
        base={context.base}
        currency={context.currency}
        imageFit={context.imageFit ?? "cover"}
        imageRatio={context.imageRatio ?? "1 / 1"}
      />
    </>
  );
}
