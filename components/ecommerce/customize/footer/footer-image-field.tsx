"use client";
// coding-standard: maintained

import { useRef } from "react";
import { useUploadStorefrontImage } from "@/services/api";
import type { FooterImage } from "@/lib/storefront-footer/types";
import type { ImageSize } from "@/lib/image-ratio";
import { MediaField } from "@/components/ecommerce/customize/media-field";

/**
 * One footer picture — the shared `MediaField` tile over the storefront image
 * uploader, the announcement background's own pairing (`AnnouncementBgField`).
 * Uploads at once so the preview can show it; the footer's Save persists it,
 * and that save deletes a replaced or removed picture from storage.
 */
export function FooterImageField({
  label,
  image,
  onChange,
  hint,
  recommended,
}: {
  label: string;
  image?: FooterImage | null;
  onChange: (image: FooterImage | null) => void;
  hint?: string;
  recommended?: ImageSize;
}) {
  const upload = useUploadStorefrontImage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <MediaField
      label={label}
      url={image?.mediumUrl || image?.url}
      inputRef={inputRef}
      disabled={upload.isPending}
      busy={upload.isPending}
      onPick={(file) =>
        upload.mutate(file, {
          onSuccess: (res) => {
            if (res.data) onChange(res.data);
          },
        })
      }
      onRemove={image ? () => onChange(null) : undefined}
      hint={hint}
      recommended={recommended}
    />
  );
}
