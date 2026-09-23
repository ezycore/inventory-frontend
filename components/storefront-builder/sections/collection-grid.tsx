// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { CollectionFromRoute } from "@/components/storefront/collection/collection-data";

type Spec = (typeof SECTION_SPECS)["collection-grid"]["settings"];

/**
 * A collection's products — the core section of the collection page on the
 * builder, and the page both `/products` and `/{category}/{sub?}` draw.
 *
 * It renders the grid from what the ROUTE resolved (`CollectionDataProvider`),
 * not from settings: which collection this is comes from the address, and the
 * first page of results is seeded server-side so the grid is HTML rather than a
 * skeleton. One page for every collection, which is what makes a section a
 * merchant adds here (a size guide, a delivery promise) appear on all of them.
 *
 * `layout` and `pagination` are today's `templates.collection` and
 * `templates.pagination` become section settings, unset on every page the
 * migration builds.
 *
 * The heading settings are an OVERRIDE, never the heading: one page draws every
 * collection, so unset — which is every page the migration builds — keeps each
 * collection's own name, and the shopper's language on the all-products page.
 *
 * `columns` and the card photo are the product grid's own two shape controls,
 * brought to the page that shows the most products of any in the shop. They
 * are resolved here the same way `product-main` resolves its: through
 * `sectionCardMedia`, which leaves an unset value OUT rather than defaulting
 * it, so the cards keep following Customize → Product cards.
 */
export function CollectionGridSection({ settings }: SectionViewProps<Spec>) {
  const card = sectionCardMedia(settings);
  return (
    <div className="sfb-core">
      <CollectionFromRoute
        layout={settings.layout}
        pagination={settings.pagination}
        cards={{
          columns: settings.columns,
          ...card,
          look: { cardCorners: settings.cardCorners, cardButtons: settings.cardButtons },
        }}
        header={{
          heading: settings.heading,
          subheading: settings.subheading,
          hideHeading: settings.hideHeading,
          hideCount: settings.hideCount,
        }}
      />
    </div>
  );
}
