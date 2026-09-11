"use client";
// coding-standard: maintained
import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  CONTENT_IMAGE_MAX_BYTES,
  contentPagesApi,
} from "@/services/api";
import { ToolButton } from "./toolbar-button";

/**
 * Insert an image into the body.
 *
 * **Opt-in per field** (`FormFieldConfig.allowImages`), not always on, because
 * the upload endpoint is `POST /ecommerce/content/images` behind
 * `storefront.manage`. Rendering the button where the merchant lacks that
 * permission would offer an action that always 403s — the product-description
 * editor is exactly that case today, so it does not get the button until the
 * endpoint's permission story covers it.
 *
 * The upload fires on pick, before the page is saved, because the editor needs a
 * real URL to render. An abandoned edit therefore orphans the object in R2 —
 * accepted, and swept by the tenant purge (see the backend service).
 */
export function ImageButton({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file || !editor) return;
    if (file.size > CONTENT_IMAGE_MAX_BYTES) {
      toast.error(
        `That image is too large — keep it under ${Math.round(
          CONTENT_IMAGE_MAX_BYTES / (1024 * 1024),
        )}MB.`,
      );
      return;
    }
    setBusy(true);
    try {
      const res = await contentPagesApi.uploadImage(file);
      const url = res.data?.url;
      if (!url) throw new Error("Upload returned no URL");
      // `alt` starts empty and stays a real attribute — an undescribed image is
      // decorative, which is what `alt=""` says. The merchant can describe it
      // later; a missing attribute would make a screen reader read the filename.
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
    } catch {
      toast.error("Could not upload that image. Please try again.");
    } finally {
      setBusy(false);
      // Reset so picking the SAME file twice still fires `change`.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <ToolButton
        label={busy ? "Uploading image…" : "Insert image"}
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus />
      </ToolButton>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </>
  );
}
