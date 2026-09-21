"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handling";
import { storefrontPagesApi } from "@/services/api";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import { RICH_IMAGE_MAX_BYTES } from "@/components/shared/rich-text-editor/image-upload";

const urlOf = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { url } = value as { url?: unknown };
  return typeof url === "string" ? url : undefined;
};

/**
 * A section's picture. Uploads the moment a file is picked — the preview needs
 * its URL before the draft saves — through the builder's own upload
 * (`storefront.design`), and stores what the upload answered: the three variants
 * and the storage key.
 */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (file.size > RICH_IMAGE_MAX_BYTES) {
      toast.error("A picture can be up to 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const response = await storefrontPagesApi.uploadImage(file);
      if (response.data) onChange({ ...response.data });
    } catch (error) {
      handleMutationError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <MediaField
      label={label}
      url={urlOf(value)}
      inputRef={inputRef}
      disabled={busy}
      busy={busy}
      onPick={(file) => void pick(file)}
      onRemove={() => onChange(undefined)}
      hint={hint}
    />
  );
}
