// coding-standard: maintained
import type { CatalogProduct } from "@/lib/storefront-client";
import type { CardMedia } from "@/lib/storefront-builder/card-media";
import { ProductCard } from "@/components/storefront/product-card";

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
export function ProductRailTrack({
  products,
  currency,
  imageFit,
  imageRatio,
}: {
  products: readonly CatalogProduct[];
  currency?: string;
} & CardMedia) {
  return (
    <div
      style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: "minmax(150px, calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols)))",
        gap: "var(--gap)",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        // Room for the cards' shadow and the scrollbar, so neither is clipped.
        padding: "2px 0 10px",
        scrollbarWidth: "thin",
      }}
    >
      {products.map((p) => (
        <div key={p._id} style={{ scrollSnapAlign: "start" }}>
          <ProductCard
            product={p}
            currency={currency}
            variant="compact"
            imageFit={imageFit}
            imageRatio={imageRatio}
          />
        </div>
      ))}
    </div>
  );
}
