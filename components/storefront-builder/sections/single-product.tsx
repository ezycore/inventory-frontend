// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["single-product"]["settings"];

/**
 * One product, bought on the page: the single-product island draws the product
 * page's own photos, options, price and buy controls. Nothing is drawn when the
 * product is gone — unlisted, deleted or another store's.
 */
export function SingleProductSection({ settings, data }: SectionViewProps<Spec>) {
  const product = data?.items[0];
  if (!product) return null;
  return (
    <Island
      name="single-product"
      props={{
        product,
        galleryLayout: settings.galleryLayout,
        hideDescription: settings.hideDescription ?? false,
      }}
    />
  );
}
