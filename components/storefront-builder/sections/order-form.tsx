// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["order-form"]["settings"];

/**
 * The merchant's heading and line, then the order form island for the section's
 * one product. Nothing is drawn when the product is gone — unlisted, deleted or
 * another store's — because a form that cannot take an order is worse than none.
 */
export function OrderFormSection({ settings, data }: SectionViewProps<Spec>) {
  const product = data?.items[0];
  if (!product) return null;
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {settings.heading ? (
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          {settings.heading}
        </h2>
      ) : null}
      {settings.text ? (
        <p style={{ margin: "0 0 16px", color: "var(--muted)", lineHeight: 1.6 }}>{settings.text}</p>
      ) : null}
      <Island name="order-form" props={{ product, coupon: settings.coupon ?? false }} />
    </div>
  );
}
