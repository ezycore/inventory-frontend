// coding-standard: maintained
import { storePageMetadata } from "@/lib/storefront-metadata";
import { SystemPage } from "@/components/storefront-builder/system-page";
import { CheckoutPageView } from "@/components/storefront/checkout/checkout-page";

export async function generateMetadata() {
  return storePageMetadata({ title: "Checkout", index: false });
}

/**
 * Checkout. There is no page control here and there must not be one — a shop
 * that cannot be paid is not a shop. "Pause online orders" is the switch that
 * covers that case, and the view shows the merchant's message itself.
 */
export default function Page() {
  return (
    <SystemPage path="/checkout">
      <CheckoutPageView />
    </SystemPage>
  );
}
