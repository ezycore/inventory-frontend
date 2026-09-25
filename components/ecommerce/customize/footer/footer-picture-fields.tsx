"use client";
// coding-standard: maintained

import type { StorefrontFooterStyle } from "@/types";
import { NumberField } from "@/ui/components/number-field";
import { PartField } from "@/components/ecommerce/customize/part-group";
import { FocalPointPicker } from "@/components/ecommerce/customize/focal-point-picker";
import { FooterImageField } from "@/components/ecommerce/customize/footer/footer-image-field";

/** Readability overlay a new background starts with — see `footerFrame`. */
const DEFAULT_OVERLAY = 55;

/**
 * The footer's own pictures: a footer-only logo (a light mark on a dark footer
 * is the usual reason) and a background photo. Neither is required — without
 * them the footer draws the store logo on its plain ground, as before.
 */
export function FooterPictureFields({
  style,
  setStyle,
}: {
  style: StorefrontFooterStyle;
  setStyle: (next: Partial<StorefrontFooterStyle>) => void;
}) {
  const bgUrl = style.bgImage?.mediumUrl || style.bgImage?.url;
  return (
    <div className="space-y-4">
      <FooterImageField
        label="Footer logo"
        image={style.logo}
        onChange={(logo) => setStyle({ logo })}
        hint="Optional. Shown in the footer instead of your store logo — useful for a light logo on a dark footer."
      />
      {style.logo ? (
        <PartField label="Logo height (px)">
          <NumberField
            value={style.logoHeight ?? null}
            onChange={(v) => setStyle({ logoHeight: v ?? undefined })}
            min={18}
            max={60}
            precision={0}
          />
        </PartField>
      ) : null}

      <FooterImageField
        label="Background photo"
        image={style.bgImage}
        onChange={(bgImage) =>
          setStyle(bgImage ? { bgImage } : { bgImage, bgFocal: undefined, overlay: undefined })
        }
        hint="Optional. Covers the whole footer, with a shade over it so the text stays readable. On a phone the footer is tall and narrow, so pick the part that must stay in view below."
      />
      {bgUrl ? (
        <>
          <FocalPointPicker
            url={bgUrl}
            value={style.bgFocal}
            onChange={(bgFocal) => setStyle({ bgFocal })}
            previewLabel="Keep this part in view"
          />
          <PartField label="Shade over the photo (%)" hint="Higher keeps the text readable on a busy photo.">
            <NumberField
              value={style.overlay ?? DEFAULT_OVERLAY}
              onChange={(v) => setStyle({ overlay: v ?? undefined })}
              min={0}
              max={90}
              precision={0}
            />
          </PartField>
        </>
      ) : null}
    </div>
  );
}
