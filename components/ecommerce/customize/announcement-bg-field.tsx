"use client";
// coding-standard: maintained

import { useRef } from "react";
import { useUploadStorefrontImage } from "@/services/api";
import type { Image } from "@/types";
import { MediaField } from "@/components/ecommerce/customize/media-field";

/**
 * Announcement-bar background image upload — reuses the shared MediaField tile
 * and the generic storefront image uploader. Uploads immediately and hands the
 * uploadInfo up; persistence happens with the rest of the announcement on the
 * page's Save (the settings PATCH also cleans up a replaced image).
 */
export function AnnouncementBgField({
  image,
  onChange,
}: {
  image: Image | null;
  onChange: (image: Image | null) => void;
}) {
  const upload = useUploadStorefrontImage();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (file: File) =>
    upload.mutate(file, {
      onSuccess: (res) => {
        if (res.data) onChange(res.data);
      },
    });

  return (
    <MediaField
      label="Background image"
      url={image?.mediumUrl || image?.url}
      inputRef={inputRef}
      disabled={upload.isPending}
      busy={upload.isPending}
      onPick={onPick}
      onRemove={() => onChange(null)}
      hint="Optional. 1600 × 200 px works best (or a small seamless tile for the tile fit). Painted behind the text with an overlay for readability."
    />
  );
}
