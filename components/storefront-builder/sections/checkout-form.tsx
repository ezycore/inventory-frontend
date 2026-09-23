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
 *
 * `hideCoupon` is handed over as BOTH screens' answers rather than one resolved
 * boolean: the view has to render for a phone and a desktop at once and let CSS
 * choose, because the server cannot know which one is asking. An unset screen
 * inherits the desktop, which is what `?? base` says here — the same rule every
 * responsive setting follows.
 */
export function CheckoutFormSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-core">
      <CheckoutPageView
        layout={settings.layout}
        hideCoupon={{
          desktop: settings.hideCoupon?.base === true,
          mobile: (settings.hideCoupon?.mobile ?? settings.hideCoupon?.base) === true,
        }}
      />
    </div>
  );
}
