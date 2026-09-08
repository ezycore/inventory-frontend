"use client";
// coding-standard: maintained

import { ColorField } from "@/ui/components/color-field";
import { Label } from "@/ui/components/label";
import { OptionChip } from "@/ui/components/option-card";
import { Switch } from "@/ui/components/switch";
import { PartHint, PartLabel } from "@/components/ecommerce/customize/part-group";
import { ResponsiveVisibilityField } from "@/components/ecommerce/customize/parts/responsive-visibility-field";
import type {
  CampaignStripDraft,
  CustomizeDraftApi,
} from "@/components/ecommerce/customize/use-customize-draft";
import {
  STRIP_SIZE_LABELS,
  STRIP_SPACE_LABELS,
} from "@/lib/storefront-strip-display";
import type { StorefrontStripSpace } from "@/types";

const SCOPES: { value: CampaignStripDraft["showOn"]; label: string; hint: string }[] = [
  { value: "all", label: "All pages", hint: "Everywhere in the store" },
  { value: "home", label: "Home page only", hint: "Just the landing page" },
];

const SIZES = (["sm", "md", "lg"] as const).map((value) => ({
  value,
  label: STRIP_SIZE_LABELS[value],
}));

const SPACES = (["sm", "md", "lg"] as const).map((value) => ({
  value,
  label: STRIP_SPACE_LABELS[value],
}));

/**
 * The live-campaign strip under the header. Its on/off switch lives on the part
 * row, so the editor stays collapsed until the merchant wants it.
 *
 * **There is no message, discount or date field here on purpose.** What the
 * strip says comes from the campaign running in Marketing → Campaigns, and
 * *whether* one is running is that campaign's own start/end window — resolved
 * server-side, before the storefront sees a list. Everything in this panel is
 * presentation: it can hide a running campaign, never surface a finished one.
 * The hint below says so, because a merchant who expects this panel to control
 * the sale will otherwise read an empty storefront as a bug.
 */
export function CampaignStripPart({
  draft,
  patchCampaignStrip,
}: Pick<CustomizeDraftApi, "draft" | "patchCampaignStrip">) {
  const value = draft.campaignStrip;

  if (!value.enabled) {
    return (
      <PartHint>
        Turn this on to show a bar under the header whenever a campaign is
        running. It appears and disappears on its own with the campaign&apos;s
        dates.
      </PartHint>
    );
  }

  return (
    <div className="grid gap-3">
      <PartHint>
        The wording and discount come from the running campaign (Marketing →
        Campaigns), and it shows only while that campaign is live. These settings
        control how it looks and where it appears.
      </PartHint>

      <div className="space-y-1.5">
        <PartLabel>Pages</PartLabel>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <OptionChip
              key={s.value}
              selected={value.showOn === s.value}
              onSelect={() => patchCampaignStrip({ showOn: s.value })}
              title={s.hint}
            >
              {s.label}
            </OptionChip>
          ))}
        </div>
        <PartHint>
          A campaign is worth knowing about on the product and cart pages too, so
          all pages is the default.
        </PartHint>
      </div>

      <ResponsiveVisibilityField
        showOnDesktop={value.showOnDesktop}
        showOnMobile={value.showOnMobile}
        onChange={patchCampaignStrip}
        what="strip"
      />

      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Background"
          value={value.bgColor}
          onChange={(bgColor) => patchCampaignStrip({ bgColor })}
          hint="Blank = your theme colour"
        />
        <ColorField
          label="Text colour"
          value={value.textColor}
          onChange={(textColor) => patchCampaignStrip({ textColor })}
          hint="Blank = matched for contrast"
        />
      </div>

      <div className="space-y-1.5">
        <PartLabel>Text size</PartLabel>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <OptionChip
              key={s.value}
              selected={value.size === s.value}
              onSelect={() => patchCampaignStrip({ size: s.value })}
            >
              {s.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SpaceField
          label="Height"
          hint="Space above and below"
          value={value.paddingY}
          onSelect={(paddingY) => patchCampaignStrip({ paddingY })}
        />
        <SpaceField
          label="Side space"
          hint="Space left and right"
          value={value.paddingX}
          onSelect={(paddingX) => patchCampaignStrip({ paddingX })}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="cursor-default">Dismissible</Label>
          <PartHint>
            Let shoppers close the strip. It comes back when a different campaign
            starts.
          </PartHint>
        </div>
        <Switch
          checked={value.dismissible}
          onCheckedChange={(dismissible) => patchCampaignStrip({ dismissible })}
          aria-label="Let shoppers dismiss the campaign strip"
        />
      </div>
    </div>
  );
}

/**
 * One spacing axis as three presets.
 *
 * Presets, not a pixel input: the strip is full-bleed directly under the
 * header, so a free number is how a merchant pushes their own hero off the
 * screen or crushes the text into the nav. The pixel values live in
 * `storefront.css`, keyed off the `data-strip-*` attributes
 * `storefront-strip-display.ts` puts on the element — which is what lets each
 * preset carry a different value on a phone and on a desktop. An inline pixel
 * value could not: it outranks every media query.
 */
function SpaceField({
  label,
  hint,
  value,
  onSelect,
}: {
  label: string;
  hint: string;
  value: StorefrontStripSpace;
  onSelect: (v: StorefrontStripSpace) => void;
}) {
  return (
    <div className="space-y-1.5">
      <PartLabel>{label}</PartLabel>
      <div className="flex flex-wrap gap-2">
        {SPACES.map((s) => (
          <OptionChip
            key={s.value}
            selected={value === s.value}
            onSelect={() => onSelect(s.value)}
          >
            {s.label}
          </OptionChip>
        ))}
      </div>
      <PartHint>{hint}</PartHint>
    </div>
  );
}
