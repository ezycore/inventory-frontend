"use client";
// coding-standard: maintained

import type { StorefrontFooterStyle } from "@/types";
import type { FooterBottomAlign } from "@/lib/storefront-footer/types";
import { Input } from "@/ui/components/input";
import { SegmentedField } from "@/ui/components/segmented-field";
import { PartField, PartSwitch } from "@/components/ecommerce/customize/part-group";
import { ResponsiveVisibilityField } from "@/components/ecommerce/customize/parts/responsive-visibility-field";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

export const BOTTOM_ALIGN_OPTIONS = [
  { value: "spread", label: "Spread", description: "Copyright left, your note right" },
  { value: "center", label: "Centred", description: "Everything on one centred line" },
];

/**
 * Everything on the closing © line, in one place: the right-side note, where
 * payment methods show, the platform credit and the alignment. They used to be
 * spread over Wording, Look and a Payment methods section of their own.
 *
 * The phone's own alignment sits with the other phone overrides in Look.
 */
export function FooterBottomLineFields({
  draft,
  patch,
  defaultAlign,
}: Pick<CustomizeDraftApi, "draft" | "patch"> & {
  /** What the line does when unset — the centred layout centres it. */
  defaultAlign: FooterBottomAlign;
}) {
  const style = draft.footerStyle;
  const setStyle = (next: Partial<StorefrontFooterStyle>) => patch({ footerStyle: { ...style, ...next } });

  return (
    <div className="space-y-4">
      <PartField
        label="Text on the right"
        hint="A trade licence number, a city, anything you need there."
      >
        <Input
          value={draft.footerNote}
          onChange={(e) => patch({ footerNote: e.target.value })}
          maxLength={80}
          placeholder="Leave empty to show your currency"
        />
      </PartField>
      <PartField
        label="Payment methods"
        hint="Your enabled checkout methods, as small badges. Hiding them here does not turn them off at checkout."
      >
        <ResponsiveVisibilityField
          showOnDesktop={draft.footerPaymentMethods.showOnDesktop}
          showOnMobile={draft.footerPaymentMethods.showOnMobile}
          onChange={(value) => patch({ footerPaymentMethods: { ...draft.footerPaymentMethods, ...value } })}
          what="payment methods"
        />
      </PartField>
      <PartSwitch
        label="“Powered by EzyCore”"
        detail="The credit after your shop name"
        ariaLabel="Show “Powered by EzyCore” in the footer"
        checked={style.showPoweredBy !== false}
        onCheckedChange={(on) => setStyle({ showPoweredBy: on ? undefined : false })}
      />
      <SegmentedField
        label="Alignment"
        value={style.bottomAlign?.base ?? defaultAlign}
        onChange={(v) => setStyle({ bottomAlign: { ...style.bottomAlign, base: v as FooterBottomAlign } })}
        options={BOTTOM_ALIGN_OPTIONS}
      />
    </div>
  );
}
