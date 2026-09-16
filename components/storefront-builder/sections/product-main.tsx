// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { ProductFromRoute } from "@/components/storefront/product/product-data";

type Spec = (typeof SECTION_SPECS)["product-main"]["settings"];

/**
 * The product itself — photos, options, price and buy buttons — as the core
 * section of the product page on the builder.
 *
 * Which product comes from the address, so this draws what the route resolved.
 * One page for every product in the catalogue: a section a merchant adds here (a
 * size guide, a delivery promise, an FAQ) appears under every product at once,
 * which is the point of the page being editable at all.
 *
 * `hideRelated` drops the view's own "You may also like" row, so a Related
 * products section placed elsewhere on the page can take its place; unset keeps
 * the row, as the classic product page draws it.
 */
export function ProductMainSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-core">
      <ProductFromRoute hideRelated={settings.hideRelated ?? false} />
    </div>
  );
}
