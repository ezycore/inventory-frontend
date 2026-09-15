// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { collectionHref } from "@/lib/storefront-links";
import { sectionCategories } from "@/lib/storefront-builder/store-lists";
import { SectionTitle } from "@/components/storefront/sf-bits";
import {
  COLLECTION_STRIP_GAP,
  CollectionLinks,
  CollectionTile,
  CollectionsGrid,
  collectionRowLabels,
  collectionStripClass,
} from "@/components/storefront/home/collection-tiles";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["collections-row"]["settings"];

/**
 * The store's collections as picture tiles — a scrolling strip or a grid — or
 * as plain text links: the home page's collections row as a section, its
 * settings on the instance instead of on the theme.
 *
 * Nothing picked lists every top-level collection, like the home page row.
 * Tiles are server markup shared with that row (`collection-tiles.tsx`); only
 * the strip's arrows are client code, loaded through the island map.
 */
export function CollectionsRowSection({ settings, context }: SectionViewProps<Spec>) {
  const categories = sectionCategories(context.categories ?? [], settings.categoryIds);
  if (categories.length === 0) return null;
  const heading = settings.heading ? <SectionTitle>{settings.heading}</SectionTitle> : null;

  if (settings.style === "plain") {
    return (
      // The home page's 980px column for plain links, measured with its padding inside.
      <div style={{ maxWidth: "calc(980px - 2 * var(--pad))", margin: "0 auto" }}>
        {heading}
        <CollectionLinks base={context.base} categories={categories} />
      </div>
    );
  }

  const grid = settings.layout === "grid";
  const align = settings.align ?? "left";
  const labels = collectionRowLabels(categories, settings.showLabels ?? true);
  const tiles = categories.map((category) => (
    <CollectionTile
      key={category._id}
      category={category}
      href={collectionHref(context.base, category)}
      strip={!grid}
      showLabel={labels}
    />
  ));

  return (
    <>
      {heading}
      {grid ? (
        <CollectionsGrid
          align={align}
          columns={settings.columns}
          mobileColumns={settings.mobileColumns}
          bare={!labels}
        >
          {tiles}
        </CollectionsGrid>
      ) : (
        <Island
          name="category-strip"
          props={{ align, gap: COLLECTION_STRIP_GAP, className: collectionStripClass(labels), children: tiles }}
        />
      )}
    </>
  );
}
