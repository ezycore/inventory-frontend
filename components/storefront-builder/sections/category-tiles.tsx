// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
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
    <>
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
        renderStrip={(strip) => <Island name="category-strip" props={strip} />}
      />
    </>
  );
}
