// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { PickGrid } from "@/components/storefront/home/pick-grid";
import { SectionHeading } from "@/components/storefront-builder/section-heading";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["selected-products"]["settings"];

/**
 * A short, bare edit of products — photo, name, price: the home page's minimal
 * picks as a section. The spec caps it at six; a page wanting more wants a
 * product grid. Photos follow the store's product-card fit and ratio unless the
 * section sets its own.
 */
export function SelectedProductsSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;
  const media = sectionCardMedia(settings);
  return (
    <>
      <SectionHeading
        base={context.base}
        heading={settings.heading}
        linkLabel={settings.ctaLabel}
        linkHref={settings.ctaHref}
      />
      <PickGrid
        products={products}
        base={context.base}
        currency={context.currency}
        imageFit={media.imageFit ?? context.imageFit ?? "cover"}
        imageRatio={media.imageRatio ?? context.imageRatio ?? "1 / 1"}
      />
    </>
  );
}
