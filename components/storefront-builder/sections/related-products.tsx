// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["related-products"]["settings"];

/**
 * Products like the page's own — the product page's "You may also like" row as
 * a section, for a merchant who wants it somewhere else or under their own
 * heading (hide the core section's row, then place this). Product page only;
 * draws nothing without the page's product.
 */
export function RelatedProductsSection({ settings, context }: SectionViewProps<Spec>) {
  const product = context.product;
  if (!product) return null;
  return (
    <Island
      name="related-products"
      props={{
        product: { slug: product.slug, categoryId: product.categoryId },
        heading: settings.heading,
        subheading: settings.subheading,
        limit: settings.limit,
        columns: settings.columns,
        currency: context.currency,
      }}
    />
  );
}
