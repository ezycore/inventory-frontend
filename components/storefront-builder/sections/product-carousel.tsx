// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardLook, sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { SectionHeading } from "@/components/storefront-builder/section-heading";
import { productRowHeading } from "@/components/storefront-builder/product-row-heading";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["product-carousel"]["settings"];

/**
 * Products in one row a shopper swipes: the home page's product rail as a
 * section. The heading is server markup; the cards are the storefront's own
 * `ProductCard`s in the rail track, loaded as an island because they carry the
 * cart. The home rail's `--surface` band is this section's style box
 * background. The card photo shape and fit follow the store unless the section
 * sets its own.
 */
export function ProductCarouselSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;
  return (
    <>
      <SectionHeading base={context.base} {...productRowHeading(settings, context, "newArrivals")} />
      {/* `--cols` is what the rail's track divides itself by, and it is read
          from the DOM rather than passed as a prop — so the merchant's choice
          rides a custom property the island inherits, and the phone can answer
          differently without a second rendering path. */}
      <div
        style={responsiveVars("cols", settings.perView) as CSSProperties}
        {...sectionCardLook(settings)}
      >
        <Island
          name="product-rail"
          props={{
            products,
            currency: context.currency,
            // ⚠ Must reach the ISLAND, not stop here — `perView` rides `--cols`
            // above, but `arrows` is behaviour and has to be a prop (§0.4).
            arrows: settings.arrows === true,
            ...sectionCardMedia(settings),
          }}
        />
      </div>
    </>
  );
}
