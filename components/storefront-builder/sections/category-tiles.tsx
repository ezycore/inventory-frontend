// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { ASPECT_RATIOS } from "@/lib/storefront-builder/aspect-ratios";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { sectionCategories } from "@/lib/storefront-builder/store-lists";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { CategoryTileRow } from "@/components/storefront/home/category-tile-row";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["category-tiles"]["settings"];

/**
 * A picture per collection, in a grid or a scrolling strip: the home page's
 * category tiles as a section. Nothing picked lists every top-level collection.
 * Photos follow the store's product-card image fit, like the home tiles.
 *
 * Unlike the home section it does not hide itself under the `rail` shell: a
 * builder page is composed on purpose, and its chrome may be `minimal` or
 * `none`, where these tiles are the only way into the catalogue.
 */
export function CategoryTilesSection({ settings, context }: SectionViewProps<Spec>) {
  const categories = sectionCategories(context.categories ?? [], settings.categoryIds);
  if (categories.length === 0) return null;
  return (
    /* The tile's shape as a variable with `1 / 1` behind it, because
       `collection-tiles.tsx` is drawn by the CLASSIC home too and that page sets
       nothing — so it keeps the square it has always drawn. This is the size
       question the design register declined on 2026-09-07 and the owner's
       2026-09-14 direction reopened. */
    <div
      style={
        {
          ...responsiveVars("sfb-tile-ratio", settings.tileRatio, (r) => ASPECT_RATIOS[r]),
          /* Unset stays UNSET rather than resolving to a number here: the tiles
             fall back to the theme's own radius tokens, and two of them (card
             and photo) differ. See `TILE_RADIUS` in `category-tile-row.tsx`. */
          ...(settings.radius === undefined ? {} : { "--sfb-tile-radius": `${settings.radius}px` }),
        } as CSSProperties
      }
    >
      {settings.heading ? (
        <SectionTitle subheading={settings.subheading}>{settings.heading}</SectionTitle>
      ) : null}
      <CategoryTileRow
        base={context.base}
        categories={categories}
        mode={settings.mode ?? "tile"}
        row={{
          style: "card",
          layout: settings.layout ?? "grid",
          columns: settings.columns ?? 4,
          mobileColumns: settings.mobileColumns ?? 2,
          align: settings.align ?? "left",
          showLabels: settings.showLabels ?? true,
          columnsExplicit: settings.columns !== undefined,
        }}
        imageFit={context.imageFit ?? "cover"}
        hideDescription={settings.hideDescription}
        arrows={settings.arrows}
        renderStrip={(strip) => <Island name="category-strip" props={strip} />}
      />
    </div>
  );
}
