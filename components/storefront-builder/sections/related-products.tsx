// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardLook, sectionCardMedia } from "@/lib/storefront-builder/card-media";
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
    // The wrapper exists ONLY to carry the card chrome: the attributes redefine
    // `--radius-md` and the `--btn-*` group for the island's subtree, and an
    // island's props cannot do that — a custom property has to be on an element
    // the cards are inside.
    <div {...sectionCardLook(settings)}>
      <Island
        name="related-products"
        props={{
          product: { slug: product.slug, categoryId: product.categoryId },
          heading: settings.heading,
          subheading: settings.subheading,
          limit: settings.limit,
          columns: settings.columns,
          currency: context.currency,
          // ⚠ The card photo has to be SPREAD here, not just declared in the
          // spec. It was offered on the Style tab and never passed, so a
          // merchant could set a shape and a fit and the cards ignored both —
          // the exact miss the plan's §0.4 names, made in the same change that
          // added the setting. Found in a browser on 2026-09-21, by comparing
          // the rendered card against the core section's beside it.
          ...sectionCardMedia(settings),
        }}
      />
    </div>
  );
}
