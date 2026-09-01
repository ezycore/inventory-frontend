"use client";
// coding-standard: maintained

import { useRef } from "react";
import { useUploadStorefrontImage } from "@/services/api";
import type { Image } from "@/types";
import type { StoreFocalPoint } from "@/lib/storefront-focal";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import { FocalPointPicker } from "@/components/ecommerce/customize/focal-point-picker";
import { cropsPhoto } from "@/components/ecommerce/customize/photo-fit-field";
import { HeroArtworkPreview } from "@/components/ecommerce/customize/hero-artwork-preview";

export function MobileHeroImageField({
  desktopUrl,
  desktopFocal,
  image,
  focal,
  imageFit,
  onImageReplace,
  onFocalChange,
}: {
  desktopUrl?: string;
  desktopFocal?: StoreFocalPoint;
  image?: Image | null;
  focal?: StoreFocalPoint;
  imageFit?: string;
  /** Parent replaces the image and clears its focal point in one atomic patch. */
  onImageReplace: (image: Image | null) => void;
  onFocalChange: (focal: StoreFocalPoint | undefined) => void;
}) {
  const upload = useUploadStorefrontImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileUrl = image?.mediumUrl || image?.url;

  const onPick = (file: File) =>
    upload.mutate(file, {
      onSuccess: (res) => {
        if (res.data) {
          onImageReplace(res.data);
        }
      },
    });

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-2.5">
      <MediaField
        label="Mobile image (optional)"
        url={mobileUrl}
        inputRef={inputRef}
        disabled={upload.isPending}
        busy={upload.isPending}
        onPick={onPick}
        onRemove={mobileUrl ? () => {
          onImageReplace(null);
        } : undefined}
        hint="Use separate phone artwork when the desktop composition cannot crop well. Leave empty to use the desktop image automatically."
      />
      {mobileUrl && cropsPhoto(imageFit) ? (
        <FocalPointPicker
          url={mobileUrl}
          value={focal || desktopFocal}
          onChange={onFocalChange}
          previewLabel="Mobile crop"
        />
      ) : null}
      <HeroArtworkPreview
        desktopUrl={desktopUrl}
        mobileUrl={mobileUrl}
        imageFit={imageFit}
        focal={desktopFocal}
        mobileFocal={focal}
      />
      <p className="text-xs leading-snug text-muted-foreground">
        Phones keep one image surface: title and button overlay its bottom gradient;
        badge and subtitle hide. Keep promotional wording in the text fields—not
        baked into the image—so it remains readable.
      </p>
    </div>
  );
}
