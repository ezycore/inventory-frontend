// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardLook, sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { responsiveClasses, responsiveVars } from "@/lib/storefront-builder/responsive";
import { SectionHeading } from "@/components/storefront-builder/section-heading";
import { productRowHeading } from "@/components/storefront-builder/product-row-heading";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["product-grid"]["settings"];

/**
 * A grid of products from one source. The heading and the grid box are server
 * markup; the cards are the storefront's own `ProductCard`s, loaded as an island
 * because they carry the cart and quick-buy.
 *
 * `columns` overrides the store's responsive `--cols` ramp only when the
 * merchant set it, and **only on the screens they answered for**
 * (`responsiveClasses`, `.sfb-cols` / `.sfb-cols-m` in
 * `app/(storefront)/storefront-builder.css`);
 * the card photo shape and fit likewise, only when the section sets them. A row
 * that keeps the store's wording takes its heading, "View all" link and
 * whole-row trim from `productRowHeading` and `wholeRows`.
 */
export function ProductGridSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;
  return (
    <div
      className={responsiveClasses("sfb-cols", settings.columns)}
      style={responsiveVars("sfb-cols", settings.columns)}
      {...sectionCardLook(settings)}
    >
      <SectionHeading base={context.base} {...productRowHeading(settings, context, "featured")} />
      <Island
        name="product-cards"
        props={{
          products,
          currency: context.currency,
          wholeRows: !!settings.wholeRows && settings.source !== "manual",
          ...sectionCardMedia(settings),
        }}
      />
    </div>
  );
}
