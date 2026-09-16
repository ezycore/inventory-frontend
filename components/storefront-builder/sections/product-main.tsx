// coding-standard: maintained
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { ProductFromRoute } from "@/components/storefront/product/product-data";

/**
 * The product itself — photos, options, price and buy buttons — as the core
 * section of the product page on the builder.
 *
 * Which product comes from the address, so this takes no settings and draws what
 * the route resolved. One page for every product in the catalogue: a section a
 * merchant adds here (a size guide, a delivery promise, an FAQ) appears under
 * every product at once, which is the point of the page being editable at all.
 */
export function ProductMainSection(_props: SectionViewProps<Record<string, never>>) {
  return (
    <div className="sfb-core">
      <ProductFromRoute />
    </div>
  );
}
