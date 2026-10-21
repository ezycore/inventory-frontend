"use client";
// coding-standard: maintained

import { useState, type CSSProperties } from "react";
import { PurchaseToastView } from "@/components/storefront/social-proof/purchase-toast-view";
import { SoldChipView } from "@/components/storefront/social-proof/sold-chip";
import {
  CHIP_SWATCHES,
  isLowContrast,
  pickSocialLook,
  readableOn,
  resolveSocialLook,
  SAMPLE_PRODUCT_PHOTO,
  shopPreviewVars,
  type SocialLookKey,
} from "@/lib/storefront-social-proof";
import { PartBlock, PartField } from "@/components/ecommerce/customize/part-group";
import { SOCIAL_LOOK_OPTIONS } from "@/components/ecommerce/customize/parts/social-look-options";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { ColorField } from "@/ui/components/color-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SwatchField } from "@/ui/components/swatch-field";

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * The previews sit on the SHOP's page colour, not the admin's. On the admin's dark theme a
 * near-black theme colour drew a soft / outline / text chip on near-black — invisible, though
 * it reads perfectly on the shop.
 */
const SHOP_PAGE: CSSProperties = { background: "#f8fafc" };

/** One short ramp from `SOCIAL_LOOK_OPTIONS`. */
function Ramp({ lookKey, label, value, onChange }: {
  lookKey: SocialLookKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <SegmentedField label={label} value={value} options={SOCIAL_LOOK_OPTIONS[lookKey] ?? []} onChange={onChange} />;
}

/**
 * A chip colour: the theme, four swatches, or a custom hex. The sold chip and the stock chip each
 * have one, so a merchant can tell "124 sold" and "Only 3 left" apart at a glance.
 */
function ChipColorField({ label, value, brand, fallback, onChange }: {
  label: string;
  value: string;
  brand: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const custom = HEX.test(value) ? value : fallback;
  return (
    <>
      <PartField label="Colour">
        <SwatchField
          label={label}
          value={HEX.test(value) ? "custom" : value}
          onChange={(v) => onChange(v === "custom" ? custom : v)}
          options={[
            { value: "accent", label: "Theme", colors: [brand], description: "Your theme colour" },
            { value: "green", label: "Green", colors: [CHIP_SWATCHES.green] },
            { value: "red", label: "Red", colors: [CHIP_SWATCHES.red] },
            { value: "orange", label: "Orange", colors: [CHIP_SWATCHES.orange] },
            { value: "neutral", label: "Grey", colors: [CHIP_SWATCHES.neutral] },
            { value: "custom", label: "Custom", colors: [custom], description: "Any colour you choose" },
          ]}
        />
      </PartField>
      {HEX.test(value) ? <HexField label={label} value={value} fallback={fallback} onChange={onChange} /> : null}
    </>
  );
}

/**
 * A hex field that only writes a COMPLETE colour into the draft. The draft is saved wholesale and
 * the backend refuses a half-typed "#12", so the text lives here until it is a real colour.
 */
function HexField({ label, value, fallback, onChange }: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value ?? "");
  return (
    <ColorField
      label={label}
      value={text}
      allowEmpty={false}
      fallback={fallback}
      onChange={(next) => {
        setText(next);
        if (HEX.test(next.trim())) onChange(next.trim().toLowerCase());
      }}
    />
  );
}

/**
 * Customize → Social proof: how the sold chip and the purchase toast LOOK
 * (docs/plan/social-proof.md §6). Whether they show, and when, is Store settings → Social proof —
 * a live setting, where this is part of the discardable look draft.
 *
 * Presets and steps, not free sizes: a toast can never grow over the buy button on a phone. Both
 * previews are the storefront's own components, drawn in the draft's brand colour.
 */
export function SocialProofPart({
  draft,
  patchTemplate,
}: Pick<CustomizeDraftApi, "draft" | "patchTemplate">) {
  const t = draft.templates;
  const look = resolveSocialLook(pickSocialLook(t));
  const brand = HEX.test(draft.brandColor) ? draft.brandColor : "#2563eb";
  const themed = shopPreviewVars(brand) as CSSProperties;
  const customBg = look.toastBg ?? "#ffffff";
  const customText = look.toastText ?? readableOn(customBg);
  const lowContrast = look.toastStyle === "custom" && isLowContrast(customText, customBg);

  return (
    <>
      <PartBlock label="Sold chip" hint="Shown on product pages once Store settings → Social proof has it on.">
        <div className="flex items-center rounded-md border p-3" style={SHOP_PAGE}>
          <span style={themed}>
            <SoldChipView text="124 sold" look={look} />
          </span>
        </div>
        <PartField label="Style">
          <Ramp lookKey="soldChipStyle" label="Chip style" value={look.chipStyle} onChange={(v) => patchTemplate("soldChipStyle", v)} />
        </PartField>
        <ChipColorField label="Chip colour" value={look.chipColor} brand={brand} fallback="#7c3aed" onChange={(v) => patchTemplate("soldChipColor", v)} />
        <PartField label="Size">
          <Ramp lookKey="soldChipSize" label="Chip size" value={look.chipSize} onChange={(v) => patchTemplate("soldChipSize", v)} />
        </PartField>
        <PartField label="Icon">
          <Ramp lookKey="soldChipIcon" label="Chip icon" value={look.chipIcon} onChange={(v) => patchTemplate("soldChipIcon", v)} />
        </PartField>
      </PartBlock>

      <PartBlock label="Low stock chip" hint="“Only 3 left” — the sold chip's style and size, with its own colour and icon.">
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3" style={SHOP_PAGE}>
          <span style={themed}>
            <SoldChipView text="Only 3 left" look={look} kind="stock" />
          </span>
          <span style={themed}>
            <SoldChipView text="124 sold" look={look} />
          </span>
        </div>
        <ChipColorField label="Low stock colour" value={look.stockColor} brand={brand} fallback="#b45309" onChange={(v) => patchTemplate("stockChipColor", v)} />
        <PartField label="Icon">
          <Ramp lookKey="stockChipIcon" label="Low stock icon" value={look.stockIcon} onChange={(v) => patchTemplate("stockChipIcon", v)} />
        </PartField>
      </PartBlock>

      <PartBlock label="Purchase popup" hint="Shown in a bottom corner once Store settings → Social proof has it on.">
        <div className="rounded-md border p-3" style={SHOP_PAGE}>
          <div style={themed}>
            <PurchaseToastView
              look={look}
              text="Rahim from Dhaka bought Cotton Panjabi"
              timeText="12 min ago"
              imageUrl={SAMPLE_PRODUCT_PHOTO}
              closeLabel="Dismiss"
              onClose={() => undefined}
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <PartField label="Colours">
          <Ramp lookKey="toastStyle" label="Popup colours" value={look.toastStyle} onChange={(v) => patchTemplate("toastStyle", v)} />
        </PartField>
        {look.toastStyle === "custom" ? (
          <PartField
            label="Custom colours"
            hint={lowContrast ? "This text is hard to read on this background. Shoppers may miss it." : undefined}
            hintTone="warn"
          >
            <div className="grid grid-cols-2 gap-3">
              <HexField label="Background" value={look.toastBg ?? undefined} fallback="#ffffff" onChange={(hex) => patchTemplate("toastBg", hex)} />
              <HexField label="Text" value={look.toastText ?? undefined} fallback={customText} onChange={(hex) => patchTemplate("toastText", hex)} />
            </div>
          </PartField>
        ) : null}
        <PartField label="Size">
          <Ramp lookKey="toastSize" label="Popup size" value={look.toastSize} onChange={(v) => patchTemplate("toastSize", v)} />
        </PartField>
        <PartField label="Corners">
          <Ramp lookKey="toastRadius" label="Popup corners" value={look.toastRadius} onChange={(v) => patchTemplate("toastRadius", v)} />
        </PartField>
        <PartField label="Photo">
          <Ramp lookKey="toastImage" label="Popup photo" value={look.toastImage} onChange={(v) => patchTemplate("toastImage", v)} />
        </PartField>
      </PartBlock>
    </>
  );
}
