// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import type { Responsive } from "@/lib/storefront-builder/settings";
import { sectionCardMedia } from "@/lib/storefront-builder/card-media";
import { mediaFitFor, mediaRatioFor } from "@/lib/storefront-templates";
import { ProductFromRoute } from "@/components/storefront/product/product-data";

type Spec = (typeof SECTION_SPECS)["product-main"]["settings"];
type Ratio = Parameters<typeof mediaRatioFor>[0];

/**
 * The product itself — photos, options, price and buy buttons — as the core
 * section of the product page on the builder.
 *
 * Which product comes from the address, so this draws what the route resolved.
 * One page for every product in the catalogue: a section a merchant adds here (a
 * size guide, a delivery promise, an FAQ) appears under every product at once,
 * which is the point of the page being editable at all. The same is true of
 * every setting below — they shape the product page, not one product.
 *
 * **This view's whole job is translation.** The merchant answers in Customize's
 * own words (`square`, `crop`) and the storefront draws in CSS (`1 / 1`,
 * `cover`), so the enums are resolved here — through the same two functions
 * Customize resolves the store-wide choice with, never a second map — and the
 * page below takes values it can use. An unset setting resolves to `undefined`
 * and nothing is passed, which is what leaves a page nobody has touched drawing
 * exactly the store's own look.
 *
 * `hideRelated` drops the view's own "You may also like" row, so a Related
 * products section placed elsewhere on the page can take its place; unset keeps
 * the row, as the classic product page draws it. `layout` is today's
 * `templates.product` become a section setting, unset on every page the
 * migration builds.
 */
export function ProductMainSection({ settings }: SectionViewProps<Spec>) {
  const card = sectionCardMedia(settings);
  return (
    <div className="sfb-core">
      <ProductFromRoute
        layout={settings.layout}
        hideRelated={settings.hideRelated ?? false}
        hideDescription={settings.hideDescription ?? false}
        shape={{
          imageFit: settings.imageFit ? mediaFitFor(settings.imageFit) : undefined,
          imageRatio: frameOf(settings.imageRatio),
          relatedLimit: settings.relatedLimit,
          relatedColumns: settings.relatedColumns,
          cardImageFit: card.imageFit,
          cardImageRatio: card.imageRatio,
          cardLook: { cardCorners: settings.cardCorners, cardButtons: settings.cardButtons },
        }}
      />
    </div>
  );
}

/**
 * A responsive shape as CSS aspect ratios, or `undefined` where the merchant
 * answered on neither screen.
 *
 * ⚠ Each screen is resolved on its own and an unanswered one stays absent — it
 * must NOT inherit the other here. The phone's fallback to the desktop is the
 * stylesheet's (`var(--sfb-pdp-frame-m, var(--sfb-pdp-frame))`), and a desktop
 * filled in from a phone answer would be this view changing the screen the
 * merchant was not looking at.
 */
function frameOf(value: Responsive<Ratio> | undefined): Responsive<string> | undefined {
  if (!value || (value.base === undefined && value.mobile === undefined)) return undefined;
  return {
    ...(value.base ? { base: mediaRatioFor(value.base) } : {}),
    ...(value.mobile ? { mobile: mediaRatioFor(value.mobile) } : {}),
  };
}
