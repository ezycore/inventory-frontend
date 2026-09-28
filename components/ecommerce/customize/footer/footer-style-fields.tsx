"use client";
// coding-standard: maintained

import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/components/collapsible";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SwatchField } from "@/ui/components/swatch-field";
import { cn } from "@/ui/lib/utils";
import { PartSwitch } from "@/components/ecommerce/customize/part-group";
import { BOTTOM_ALIGN_OPTIONS } from "@/components/ecommerce/customize/footer/footer-bottom-line-fields";
import { FooterBackgroundFields } from "@/components/ecommerce/customize/footer/footer-picture-fields";

/** "Same as on a computer" — the phone value is simply left unset. */
const SAME = "same";

const SPACING = [
  { value: "compact", label: "Tight" },
  { value: "regular", label: "Regular" },
  { value: "roomy", label: "Roomy" },
];

const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

/**
 * The footer's frame: its ground (colour or photo) and ink, spacing, how link
 * groups start on a phone, and the lines around it. The closing © line has its
 * own section (`FooterBottomLineFields`).
 *
 * The two phone-only overrides — spacing and the bottom line's alignment —
 * fold under one "Phone adjustments" row, since "Same" is the default and most
 * merchants never open it.
 */
export function FooterStyleFields({
  style,
  setStyle,
  brandColor,
  composed,
}: {
  style: StorefrontFooterStyle;
  setStyle: (next: Partial<StorefrontFooterStyle>) => void;
  brandColor: string;
  /** The footer is built from blocks — centring applies only there. */
  composed: boolean;
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
      <FooterBackgroundFields style={style} setStyle={setStyle} />
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
        label="Spacing"
        value={style.spacing?.base ?? "regular"}
        onChange={(v) => setStyle({ spacing: { ...style.spacing, base: v as FooterSpacing } })}
        options={SPACING}
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
      <PartSwitch
        label="Line above the footer"
        checked={style.topBorder !== false}
        onCheckedChange={(on) => setStyle({ topBorder: on ? undefined : false })}
      />
      {composed ? (
        <PartSwitch
          label="Centre the blocks"
          checked={style.align === "center"}
          onCheckedChange={(on) => setStyle({ align: on ? "center" : undefined })}
        />
      ) : null}

      <PhoneAdjustments style={style} setStyle={setStyle} />
    </div>
  );
}

function PhoneAdjustments({
  style,
  setStyle,
}: {
  style: StorefrontFooterStyle;
  setStyle: (next: Partial<StorefrontFooterStyle>) => void;
}) {
  const [open, setOpen] = useState(false);
  const spacing = style.spacing?.mobile;
  const bottom = style.bottomAlign?.mobile;
  const summary =
    spacing || bottom
      ? [
          spacing ? `Spacing: ${labelOf(SPACING, spacing)}` : null,
          bottom ? `Bottom line: ${labelOf(BOTTOM_ALIGN_OPTIONS, bottom)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Spacing and bottom line · same as computer";

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left">
        <span className="min-w-0">
          <span className="block text-sm font-medium">Phone adjustments</span>
          <span className="block truncate text-xs text-muted-foreground">{summary}</span>
        </span>
        <ChevronRight className={cn("h-4 w-4 flex-none text-muted-foreground transition-transform", open && "rotate-90")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t p-3">
        <SegmentedField
          label="Spacing on a phone"
          value={spacing ?? SAME}
          onChange={(v) =>
            setStyle({ spacing: { ...style.spacing, mobile: v === SAME ? undefined : (v as FooterSpacing) } })
          }
          options={[{ value: SAME, label: "Same" }, ...SPACING]}
          caption={false}
        />
        <SegmentedField
          label="Bottom line on a phone"
          value={bottom ?? SAME}
          onChange={(v) =>
            setStyle({
              bottomAlign: { ...style.bottomAlign, mobile: v === SAME ? undefined : (v as FooterBottomAlign) },
            })
          }
          options={[{ value: SAME, label: "Same" }, ...BOTTOM_ALIGN_OPTIONS.map(({ value, label }) => ({ value, label }))]}
          caption={false}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
