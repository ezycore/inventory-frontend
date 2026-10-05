// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import {
  descriptionText,
  descriptionWrap,
  ProductDescriptionView,
} from "@/components/storefront/product-description-view";

type Spec = (typeof SECTION_SPECS)["product-description"]["settings"];

/**
 * The page's product's own description, placed where the merchant put this
 * section — for a page that hides it from the product block
 * (`product-main.hideDescription`) to tell it somewhere better. Draws nothing
 * without the page's product or a description to show.
 *
 * The heading is the merchant's, else the shop's word "Description" in the
 * shopper's language (the `store-word` island — a cached view cannot know the
 * language), else none when they hid it.
 */
export function ProductDescriptionSection({ settings, context }: SectionViewProps<Spec>) {
  const description = context.product?.description;
  if (!description) return null;
  const heading = settings.hideHeading
    ? null
    : settings.heading || <Island name="store-word" props={{ word: "description" }} />;
  return (
    <div className="sfb-own-column" style={{ "--sfb-own-column": "780px" } as CSSProperties}>
      {heading ? <SectionTitle>{heading}</SectionTitle> : null}
      <div style={{ ...descriptionWrap, marginBottom: 0 }}>
        <ProductDescriptionView description={description} legacyStyle={descriptionText} />
      </div>
    </div>
  );
}
