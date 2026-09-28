"use client";
// coding-standard: maintained

import type { StorefrontFooterStyle } from "@/types";
import { NumberField } from "@/ui/components/number-field";
import { PartField } from "@/components/ecommerce/customize/part-group";
import { FocalPointPicker } from "@/components/ecommerce/customize/focal-point-picker";
import { FooterImageField } from "@/components/ecommerce/customize/footer/footer-image-field";

/** Readability overlay a new background starts with — see `footerFrame`. */
const DEFAULT_OVERLAY = 55;

interface PictureProps {
  style: StorefrontFooterStyle;
  setStyle: (next: Partial<StorefrontFooterStyle>) => void;
}

/**
 * A footer-only logo (a light mark on a dark footer is the usual reason). Lives
 * inside the brand block, under its Logo switch, because that block is the only
 * thing that draws it. Without one the footer uses the store logo, as before.
 */
export function FooterLogoFields({ style, setStyle }: PictureProps) {
  return (
    <div className="space-y-3">
      <FooterImageField
        label="Footer logo"
        image={style.logo}
        onChange={(logo) => setStyle({ logo })}
        hint="Optional. Your store logo is used until you pick one — a light version reads better on a dark footer."
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
    </div>
  );
}

/** A photo behind the whole footer, with its focal point and readability shade. Part of Look. */
export function FooterBackgroundFields({ style, setStyle }: PictureProps) {
  const bgUrl = style.bgImage?.mediumUrl || style.bgImage?.url;
  return (
    <div className="space-y-4">
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
