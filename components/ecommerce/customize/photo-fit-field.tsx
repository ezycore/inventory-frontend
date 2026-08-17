"use client";
// coding-standard: maintained

import { FocalPointPicker } from "@/components/ecommerce/customize/focal-point-picker";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";
import type { StoreFocalPoint } from "@/lib/storefront-focal";
import { Label } from "@/ui/components/label";
import { OptionChip } from "@/ui/components/option-card";

/**
 * What a photo does when its frame is the wrong shape — shown whole, or cropped
 * to fill with a chosen focus point. Used by every owner-uploaded photo big
 * enough for the answer to matter: each hero slide, and the static banner.
 *
 * **`undefined` is the default, not "inherit".** These photos used to follow
 * `templates.imageFit`, a control rendered inside the *Product cards* part — so
 * changing how product thumbnails crop silently re-cropped the shop's biggest
 * picture. A grid of small squares and a wide banner are different jobs. Unset
 * means `DEFAULT_PHOTO_FIT`: show all of it, the one answer that can never cut a
 * face or a word in half.
 *
 * Labels come from `TEMPLATE_OPTIONS.imageFit` so this and the store-wide
 * control can never describe the same two ideas in different words.
 */
export const DEFAULT_PHOTO_FIT = "fit";

/** Whether this photo actually gets cropped, so a focus point would do anything. */
export const cropsPhoto = (imageFit?: string): boolean =>
  (imageFit ?? DEFAULT_PHOTO_FIT) === "crop";

export function PhotoFitField({
  url,
  imageFit,
  focal,
  onChange,
  label = "This photo",
}: {
  /** The photo being adjusted — the medium rendition is plenty at this size. */
  url: string;
  imageFit?: string;
  focal?: StoreFocalPoint;
  /** Patch: either key may be absent, and `focal: undefined` clears the point. */
  onChange: (patch: { imageFit?: string; focal?: StoreFocalPoint }) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-background p-2.5">
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_OPTIONS.imageFit.map((f) => (
            <OptionChip
              key={f.value}
              // An untouched photo reads as its default rather than as nothing
              // selected — the merchant is looking at one of these two either way.
              selected={(imageFit ?? DEFAULT_PHOTO_FIT) === f.value}
              onSelect={() => onChange({ imageFit: f.value })}
              title={f.description}
            >
              {f.label}
            </OptionChip>
          ))}
        </div>
      </div>
      {cropsPhoto(imageFit) ? (
        <FocalPointPicker
          url={url}
          value={focal}
          onChange={(next) => onChange({ focal: next })}
        />
      ) : (
        <p className="text-xs leading-snug text-muted-foreground">
          The whole photo is shown, so there is nothing to crop.
        </p>
      )}
    </div>
  );
}
