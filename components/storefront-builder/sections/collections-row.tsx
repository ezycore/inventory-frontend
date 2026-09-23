// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { ASPECT_RATIOS } from "@/lib/storefront-builder/aspect-ratios";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
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
  const heading = settings.heading ? (
    <SectionTitle subheading={settings.subheading}>{settings.heading}</SectionTitle>
  ) : null;

  if (settings.style === "plain") {
    return (
      // The home page's 980px column for plain links, measured with its padding inside.
      <div className="sfb-own-column" style={{ "--sfb-own-column": "calc(980px - 2 * var(--pad))" } as CSSProperties}>
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
    /* The tile's shape as a variable with `1 / 1` behind it — `collection-tiles.tsx`
       is drawn by the CLASSIC home too, and that page sets nothing. */
    <div
      style={
        {
          ...responsiveVars("sfb-tile-ratio", settings.tileRatio, (r) => ASPECT_RATIOS[r]),
          // Unset stays unset — see the same note on `category-tiles.tsx`.
          ...(settings.radius === undefined ? {} : { "--sfb-tile-radius": `${settings.radius}px` }),
        } as CSSProperties
      }
    >
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
          props={{
            align,
            gap: COLLECTION_STRIP_GAP,
            className: collectionStripClass(labels),
            arrows: settings.arrows,
            children: tiles,
          }}
        />
      )}
    </div>
  );
}
