// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { CartPageView } from "@/components/storefront/cart/cart-page";

type Spec = (typeof SECTION_SPECS)["cart-lines"]["settings"];

/**
 * The cart itself — the core section of a cart page on the builder.
 *
 * It renders the SAME view the `/cart` route has always rendered, so a store
 * whose cart page has moved draws the cart it drew before; only what a merchant
 * adds above and below it is new. `layout` is today's `templates.cartLayout`
 * become a section setting, and the view keeps the Customize draft above it so
 * the editor preview still repaints while the merchant drags.
 */
export function CartLinesSection({ settings }: SectionViewProps<Spec>) {
  // `sfb-core` is what drops the section's own gutter — the cart brings one.
  return (
    <div className="sfb-core">
      <CartPageView layout={settings.layout} />
    </div>
  );
}
