"use client";
// coding-standard: maintained

import type { StorefrontFooterStyle } from "@/types";
import { FOOTER_DARK_GROUND } from "@/lib/storefront-footer/style";
import type {
  FooterBottomAlign,
  FooterGround,
  FooterPhoneGroups,
  FooterSpacing,
  FooterTone,
} from "@/lib/storefront-footer/types";
import { ColorField } from "@/ui/components/color-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SwatchField } from "@/ui/components/swatch-field";
import { PartSwitch } from "@/components/ecommerce/customize/part-group";

/** "Same as on a computer" — the phone value is simply left unset. */
const SAME = "same";

const SPACING = [
  { value: "compact", label: "Tight" },
  { value: "regular", label: "Regular" },
  { value: "roomy", label: "Roomy" },
];
const BOTTOM = [
  { value: "spread", label: "Spread", description: "Copyright left, your note right" },
  { value: "center", label: "Centred", description: "Everything on one centred line" },
];

/**
 * The footer's frame: its ground and ink, spacing, how link groups start on a
 * phone, the closing line, and the platform credit. Phone settings sit beside
 * their computer twin rather than on a separate screen, and "Same" is the
 * default — most merchants want one answer for both.
 */
export function FooterStyleFields({
  style,
  setStyle,
  brandColor,
  composed,
  defaultBottom,
}: {
  style: StorefrontFooterStyle;
  setStyle: (next: Partial<StorefrontFooterStyle>) => void;
  brandColor: string;
  /** The footer is built from blocks — centring applies only there. */
  composed: boolean;
  /** What the bottom line does when unset — the centred layout centres it. */
  defaultBottom: FooterBottomAlign;
}) {
  const ground = style.ground ?? "card";
  const inkMatters = ground !== "card" && ground !== "surface";
  const customColor = style.color ?? "#1f2937";

  return (
    <div className="space-y-4">
      <SwatchField
        label="Background"
        value={ground}
        onChange={(v) => setStyle({ ground: v === "card" ? undefined : (v as FooterGround) })}
        options={[
          { value: "card", label: "Card", colors: ["#ffffff"], description: "Your theme's card colour — the footer as it was" },
          { value: "surface", label: "Soft", colors: ["#f4f4f5"], description: "Your theme's soft background" },
          { value: "brand", label: "Brand", colors: [brandColor], description: "Your brand colour, with readable text on it" },
          { value: "dark", label: "Dark", colors: [FOOTER_DARK_GROUND], description: "Near-black with light text" },
          { value: "custom", label: "Custom", colors: [customColor], description: "Any colour you choose" },
        ]}
      />
      {ground === "custom" ? (
        <ColorField
          label="Background colour"
          value={style.color ?? ""}
          onChange={(color) => setStyle({ color })}
          allowEmpty={false}
          fallback={customColor}
        />
      ) : null}
      {inkMatters || style.bgImage ? (
        <SegmentedField
          label="Text colour"
          value={style.tone ?? "auto"}
          onChange={(v) => setStyle({ tone: v === "auto" ? undefined : (v as FooterTone) })}
          options={[
            { value: "auto", label: "Auto", description: "Picked to be readable on the background" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      ) : null}

      <SegmentedField
        label="Spacing on a computer"
        value={style.spacing?.base ?? "regular"}
        onChange={(v) => setStyle({ spacing: { ...style.spacing, base: v as FooterSpacing } })}
        options={SPACING}
        caption={false}
      />
      <SegmentedField
        label="Spacing on a phone"
        value={style.spacing?.mobile ?? SAME}
        onChange={(v) =>
          setStyle({ spacing: { ...style.spacing, mobile: v === SAME ? undefined : (v as FooterSpacing) } })
        }
        options={[{ value: SAME, label: "Same" }, ...SPACING]}
        caption={false}
      />
      <SegmentedField
        label="Link groups on a phone"
        value={style.phoneGroups ?? "open"}
        onChange={(v) => setStyle({ phoneGroups: v === "open" ? undefined : (v as FooterPhoneGroups) })}
        options={[
          { value: "open", label: "All open", description: "Every link shows — the footer is longest this way" },
          { value: "first", label: "First open", description: "The first group open, the rest tap to open" },
          { value: "closed", label: "Closed", description: "Each group is a heading shoppers tap to open" },
        ]}
      />
      {composed ? (
        <PartSwitch
          label="Centre the blocks"
          checked={style.align === "center"}
          onCheckedChange={(on) => setStyle({ align: on ? "center" : undefined })}
        />
      ) : null}
      <PartSwitch
        label="Line above the footer"
        checked={style.topBorder !== false}
        onCheckedChange={(on) => setStyle({ topBorder: on ? undefined : false })}
      />

      <SegmentedField
        label="Bottom line on a computer"
        value={style.bottomAlign?.base ?? defaultBottom}
        onChange={(v) => setStyle({ bottomAlign: { ...style.bottomAlign, base: v as FooterBottomAlign } })}
        options={BOTTOM}
      />
      <SegmentedField
        label="Bottom line on a phone"
        value={style.bottomAlign?.mobile ?? SAME}
        onChange={(v) =>
          setStyle({
            bottomAlign: { ...style.bottomAlign, mobile: v === SAME ? undefined : (v as FooterBottomAlign) },
          })
        }
        options={[{ value: SAME, label: "Same" }, ...BOTTOM.map(({ value, label }) => ({ value, label }))]}
        caption={false}
      />
      <PartSwitch
        label="“Powered by EzyCore”"
        detail="The credit in the bottom line"
        ariaLabel="Show “Powered by EzyCore” in the footer"
        checked={style.showPoweredBy !== false}
        onCheckedChange={(on) => setStyle({ showPoweredBy: on ? undefined : false })}
      />
    </div>
  );
}
