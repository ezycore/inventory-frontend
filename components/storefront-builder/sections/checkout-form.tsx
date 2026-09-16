// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { CheckoutPageView } from "@/components/storefront/checkout/checkout-page";

type Spec = (typeof SECTION_SPECS)["checkout-form"]["settings"];

/**
 * The checkout itself — the core section of a checkout page on the builder.
 *
 * The same view the `/checkout` route has always rendered, so a moved checkout
 * takes the same details in the same order; a merchant adds reassurance above
 * and below it (delivery promises, a returns note) rather than inside it.
 */
export function CheckoutFormSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-core">
      <CheckoutPageView layout={settings.layout} />
    </div>
  );
}
