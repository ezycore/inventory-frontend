// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { sectionProduct } from "@/components/storefront-builder/section-product";

type Spec = (typeof SECTION_SPECS)["sticky-order-bar"]["settings"];

/**
 * A bar pinned to the bottom of a phone screen. It takes no room where it is
 * placed on the page — the registry marks it `floating` — and draws nothing
 * when its product is gone. On the product page the product is the page's own,
 * and the bar knows it is standing on that product's page.
 */
export function StickyOrderBarSection({ settings, data, context }: SectionViewProps<Spec>) {
  const product = sectionProduct(data, context);
  if (!product) return null;
  return (
    <Island
      name="sticky-order-bar"
      props={{
        product,
        currency: context.currency,
        buttonLabel: settings.buttonLabel,
        onProductPage: !settings.productId,
      }}
    />
  );
}
