// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { sectionProduct } from "@/components/storefront-builder/section-product";

type Spec = (typeof SECTION_SPECS)["offer-pricing"]["settings"];

/**
 * The merchant's offer headline and line, then the product's price as an offer.
 *
 * The price block is an island only for its words: "From" before a variable
 * product's price and "off" after the discount are the shopper's interface
 * language, which a cached server view cannot know. The prices themselves are
 * the catalogue's, campaign pricing included — never typed by the merchant.
 * On the product page the product is the page's own.
 */
export function OfferPricingSection({ settings, data, context }: SectionViewProps<Spec>) {
  const product = sectionProduct(data, context);
  if (!product) return null;
  return (
    <div>
      {settings.heading ? (
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          {settings.heading}
        </h2>
      ) : null}
      {settings.text ? (
        <p style={{ margin: "0 0 16px", color: "var(--muted)", lineHeight: 1.6 }}>{settings.text}</p>
      ) : null}
      <Island name="offer-price" props={{ product, currency: context.currency }} />
    </div>
  );
}
