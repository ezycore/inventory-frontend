"use client";
// coding-standard: maintained

import { ColorField } from "@/ui/components/color-field";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { OptionChip } from "@/ui/components/option-card";
import { Switch } from "@/ui/components/switch";
import { AnnouncementBgField } from "@/components/ecommerce/customize/announcement-bg-field";
import { PartHint, PartLabel } from "@/components/ecommerce/customize/part-group";
import type {
  AnnouncementDraft,
  CustomizeDraftApi,
} from "@/components/ecommerce/customize/use-customize-draft";
import type { StorefrontSettings } from "@/types";
import { effectiveFreeShippingThreshold } from "@/lib/storefront-delivery";
import { money } from "@/components/storefront/format";
import { StoreLinkHint } from "@/components/ecommerce/customize/store-link-hint";

const SIZES: { value: AnnouncementDraft["size"]; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const FITS: { value: AnnouncementDraft["bgFit"]; label: string; hint: string }[] = [
  { value: "cover", label: "Cover", hint: "Fills the bar (a photo backdrop)" },
  { value: "tile", label: "Tile", hint: "Repeats a small pattern" },
];

/**
 * The single line above the storefront header. Its on/off switch lives on the
 * part row itself, so the whole editor stays collapsed until the bar is
 * actually in use.
 */
export function AnnouncementPart({
  settings,
  draft,
  patchAnnouncement,
}: Pick<CustomizeDraftApi, "draft" | "patchAnnouncement"> & {
  settings: StorefrontSettings;
}) {
  const value = draft.announcement;
  const threshold = effectiveFreeShippingThreshold(settings);

  if (!value.enabled) {
    return (
      <PartHint>
        Turn the bar on to write your message. It shows on every page of the
        store, above the header.
      </PartHint>
    );
  }

  return (
    <div className="grid gap-3">
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <span>
          <span className="block text-sm font-medium">Use shipping offer</span>
          <span className="block text-xs text-muted-foreground">
            Keep this message synced with the free-delivery threshold.
          </span>
        </span>
        <Switch
          checked={value.useShippingRule}
          onCheckedChange={(useShippingRule) =>
            patchAnnouncement({ useShippingRule })
          }
        />
      </label>

      <div className="space-y-1.5">
        <Label>Message</Label>
        <Input
          value={value.text}
          onChange={(e) => patchAnnouncement({ text: e.target.value })}
          maxLength={200}
          disabled={value.useShippingRule}
          placeholder="Free delivery on orders over ৳2000"
        />
        {value.useShippingRule ? (
          <PartHint>
            {threshold == null
              ? "Set a free-delivery threshold under Store Settings → Shipping before publishing this bar."
              : `Storefront message: Free delivery on orders over ${money(threshold, settings.currency)}`}
          </PartHint>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Icon (emoji)</Label>
          <Input
            value={value.icon}
            onChange={(e) => patchAnnouncement({ icon: e.target.value })}
            maxLength={8}
            placeholder="🚚"
          />
          <StoreLinkHint value={value.link} />
        </div>
        <div className="space-y-1.5">
          <Label>Link (optional)</Label>
          <Input
            value={value.link}
            onChange={(e) => patchAnnouncement({ link: e.target.value })}
            placeholder="/products"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Button label (optional)</Label>
        <Input
          value={value.ctaLabel}
          onChange={(e) => patchAnnouncement({ ctaLabel: e.target.value })}
          maxLength={40}
          placeholder="Shop now"
        />
        <PartHint>
          Shows a button that follows the link above. Leave it blank to make the
          whole bar the link.
        </PartHint>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Background"
          value={value.bgColor}
          onChange={(bgColor) => patchAnnouncement({ bgColor })}
          allowEmpty={false}
        />
        <ColorField
          label="Text colour"
          value={value.textColor}
          onChange={(textColor) => patchAnnouncement({ textColor })}
          hint="Blank = matched for contrast"
        />
      </div>

      <div className="space-y-3">
        <AnnouncementBgField
          image={value.bgImage}
          onChange={(bgImage) => patchAnnouncement({ bgImage })}
        />
        {value.bgImage ? (
          <div className="grid gap-3 rounded-lg border bg-background p-3">
            <div className="space-y-1.5">
              <PartLabel>Image fit</PartLabel>
              <div className="flex flex-wrap gap-2">
                {FITS.map((f) => (
                  <OptionChip
                    key={f.value}
                    selected={value.bgFit === f.value}
                    onSelect={() => patchAnnouncement({ bgFit: f.value })}
                    title={f.hint}
                  >
                    {f.label}
                  </OptionChip>
                ))}
              </div>
            </div>
            <ColorField
              label="Overlay colour"
              value={value.overlay}
              onChange={(overlay) => patchAnnouncement({ overlay })}
            />
            <div className="space-y-1.5">
              <Label>Overlay strength — {value.overlayOpacity}%</Label>
              {/* Native range: no shared Slider primitive yet. */}
              <input
                type="range"
                min={0}
                max={100}
                value={value.overlayOpacity}
                onChange={(e) =>
                  patchAnnouncement({ overlayOpacity: Number(e.target.value) })
                }
                className="w-full accent-primary"
                aria-label="Overlay strength"
              />
              <PartHint>Darkens the image so the text stays readable.</PartHint>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <PartLabel>Size</PartLabel>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <OptionChip
              key={s.value}
              selected={value.size === s.value}
              onSelect={() => patchAnnouncement({ size: s.value })}
            >
              {s.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="cursor-default">Dismissible</Label>
          <PartHint>
            Let shoppers close the bar. It comes back when the message changes.
          </PartHint>
        </div>
        <Switch
          checked={value.dismissible}
          onCheckedChange={(dismissible) => patchAnnouncement({ dismissible })}
          aria-label="Allow shoppers to dismiss the announcement bar"
        />
      </div>
    </div>
  );
}
