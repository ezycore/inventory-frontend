// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { ORDER_FORM_ANCHOR } from "@/components/storefront-builder/order-form-anchor";
import { sectionProduct } from "@/components/storefront-builder/section-product";

type Spec = (typeof SECTION_SPECS)["order-form"]["settings"];

/**
 * The merchant's heading and line, then the order form island for the section's
 * one product. Nothing is drawn when the product is gone — unlisted, deleted or
 * another store's — because a form that cannot take an order is worse than none.
 * On the product page the product is the page's own.
 *
 * The wrapper carries the order form anchor, which the sticky order bar scrolls
 * to; its scroll margin keeps the heading clear of a sticky store header.
 */
export function OrderFormSection({ settings, data, context }: SectionViewProps<Spec>) {
  const product = sectionProduct(data, context);
  if (!product) return null;
  return (
    <div
      {...{ [ORDER_FORM_ANCHOR]: "" }}
      className="sfb-own-column"
      style={
        {
          "--sfb-own-column": "560px",
          scrollMarginTop: "calc(var(--sf-header-h, 0px) + 16px)",
        } as CSSProperties
      }
    >
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
