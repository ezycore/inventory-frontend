"use client";
// coding-standard: maintained
/**
 * The homepage collections row — one tile per listed collection, linking to its
 * collection page.
 *
 * Its shape is a merchant setting (`theme.homeCollections`, Customize → Home
 * page → Collections row) rather than a constant, because the answer depends on how
 * many collections a shop has: five categories read well as a scrolling strip of
 * chips, three look stranded there and want the full row width.
 *
 * - **`strip`** — the original: fixed-width chips, horizontally scrollable, so
 *   any number of collections fits without wrapping. `CategoryStrip` supplies
 *   the track and the arrows that replaced its scrollbar.
 * - **`grid`** — equal columns filling the content width: `columns` per row on
 *   desktop, `mobileColumns` on a phone (2–4, default 2). Two counts rather
 *   than one, because a 6-column desktop row is six unreadable slivers at 360px
 *   and a merchant with fourteen departments still wants more than two across
 *   there. Both ride out as custom properties and the breakpoints in
 *   `.sf-home-collections` pick — an inline style cannot carry a media query.
 *
 * Either shape can drop the names (Customize → Collections row → "Picture
 * only"), but only for a fully photographed catalogue — see
 * `categoryLabelsVisible`.
 *
 * The tile and grid markup is shared with the Storefront Builder
 * (`collection-tiles.tsx`); this component only reads the merchant's setting.
 */
import type { CatalogCategory } from "@/lib/storefront-client";
import { collectionHref } from "@/lib/storefront-links";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useCategoryRowLayout } from "@/components/storefront/home/use-category-row-layout";
import { CategoryStrip } from "@/components/storefront/home/category-strip";
import {
  COLLECTION_STRIP_GAP,
  CollectionTile,
  CollectionsGrid,
  collectionRowLabels,
  collectionStripClass,
} from "@/components/storefront/home/collection-tiles";

export function HomeCollections({
  base,
  categories,
  defaultLayout = "strip",
}: {
  base: string;
  categories: CatalogCategory[];
  /** Section-list default: chips historically strip; tile-led pages use grid. */
  defaultLayout?: "strip" | "grid";
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const { layout, columns, mobileColumns, align, showLabels } = useCategoryRowLayout(
    store,
    defaultLayout,
  );

  if (categories.length === 0) return null;

  const grid = layout === "grid";
  const labels = collectionRowLabels(categories, showLabels);
  const tiles = categories.map((c) => (
    <CollectionTile
      key={c._id}
      category={c}
      href={collectionHref(base, c)}
      strip={!grid}
      showLabel={labels}
    />
  ));

  if (!grid) {
    return (
      <CategoryStrip align={align} gap={COLLECTION_STRIP_GAP} className={collectionStripClass(labels)}>
        {tiles}
      </CategoryStrip>
    );
  }

  return (
    <CollectionsGrid align={align} columns={columns} mobileColumns={mobileColumns} bare={!labels}>
      {tiles}
    </CollectionsGrid>
  );
}
