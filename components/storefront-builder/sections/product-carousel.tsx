// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { SectionHeading } from "@/components/storefront-builder/section-heading";
import { productRowHeading } from "@/components/storefront-builder/product-row-heading";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["product-carousel"]["settings"];

/**
 * Products in one row a shopper swipes: the home page's product rail as a
 * section. The heading is server markup; the cards are the storefront's own
 * `ProductCard`s in the rail track, loaded as an island because they carry the
 * cart. The home rail's `--surface` band is this section's style box
 * background. The card photo shape and fit follow the store unless the section
 * sets its own.
 */
export function ProductCarouselSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;
  return (
    <>
      <SectionHeading base={context.base} {...productRowHeading(settings, context, "newArrivals")} />
      <Island
        name="product-rail"
        props={{ products, currency: context.currency, ...sectionCardMedia(settings) }}
      />
    </>
  );
}
