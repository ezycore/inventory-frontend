// coding-standard: maintained
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { CollectionFromRoute } from "@/components/storefront/collection/collection-data";

/**
 * A collection's products — the core section of the collection page on the
 * builder, and the page both `/products` and `/{category}/{sub?}` draw.
 *
 * It renders the grid from what the ROUTE resolved (`CollectionDataProvider`),
 * not from settings: which collection this is comes from the address, and the
 * first page of results is seeded server-side so the grid is HTML rather than a
 * skeleton. One page for every collection, which is what makes a section a
 * merchant adds here (a size guide, a delivery promise) appear on all of them.
 */
export function CollectionGridSection(_props: SectionViewProps<Record<string, never>>) {
  return (
    <div className="sfb-core">
      <CollectionFromRoute />
    </div>
  );
}
