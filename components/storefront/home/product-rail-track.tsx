// coding-standard: maintained
import type { CSSProperties } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import type { CardMedia } from "@/lib/storefront-builder/card-media";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryStrip } from "@/components/storefront/home/category-strip";

/**
 * A horizontal scroll rail of compact product cards — the home page's
 * `ProductRail` and, as an island, the Storefront Builder's product carousel.
 *
 * `grid-auto-flow: column` + an explicit track width, because a flex row of
 * `flex: 1` cards would divide the viewport instead of overflowing. Snap points
 * keep a swipe landing on a card rather than between two.
 *
 * `imageFit` / `imageRatio` are a builder section's own card photo settings;
 * unset, every card follows the store's.
 */
const track: CSSProperties = {
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "minmax(150px, calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols)))",
  gap: "var(--gap)",
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  // Room for the cards' shadow and the scrollbar, so neither is clipped.
  padding: "2px 0 10px",
  scrollbarWidth: "thin",
};

export function ProductRailTrack({
  products,
  currency,
  arrows = false,
  arrowLabels,
  imageFit,
  imageRatio,
}: {
  products: readonly CatalogProduct[];
  currency?: string;
  /**
   * Draw paging arrows instead of the scrollbar, the way the category strip
   * does. **Off by default, and that is load-bearing**: the CLASSIC home draws
   * this same rail and passes nothing, so it keeps the bare scrolling track it
   * has always had, markup and all. Only a builder carousel whose merchant asked
   * for arrows takes the other branch.
   */
  arrows?: boolean;
  arrowLabels?: { previous: string; next: string };
} & CardMedia) {
  const cards = products.map((p) => (
    <div key={p._id} style={{ scrollSnapAlign: "start" }}>
      <ProductCard product={p} currency={currency} variant="compact" imageFit={imageFit} imageRatio={imageRatio} />
    </div>
  ));

  if (!arrows) return <div style={track}>{cards}</div>;

  /*
   * The arrows belong to `CategoryStrip`, which owns the scroll container — so
   * asking for them means handing it this rail's track. The grid that makes a
   * rail a rail moves into `.sf-rail-track` (in the builder stylesheet) so the
   * strip's own `.sf-cat-strip-track` can carry the scrolling and the arrows'
   * edge measurement, and the two combine rather than fight: the override is
   * written as `.sf-cat-strip-track.sf-rail-track`, which outweighs either alone
   * whatever order the two stylesheets load in.
   */
  return (
    <CategoryStrip align="left" gap="var(--gap)" trackClassName="sf-rail-track" arrowLabels={arrowLabels}>
      {cards}
    </CategoryStrip>
  );
}
