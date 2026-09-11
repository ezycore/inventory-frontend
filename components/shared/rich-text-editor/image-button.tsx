"use client";
// coding-standard: maintained
import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { ToolButton } from "./toolbar-button";
import {
  RICH_IMAGE_MAX_BYTES,
  RICH_IMAGE_UPLOADERS,
  type RichImageScope,
} from "./image-upload";

/**
 * Insert an image into the body.
 *
 * **Opt-in per field** (`FormFieldConfig.imageUpload`), and the scope names the
 * endpoint — page bodies and product descriptions upload to different routes
 * behind different permissions, so a field that cannot reach one of them simply
 * omits the scope and gets no button rather than one that always 403s.
 *
 * The upload fires on pick, before the record is saved, because the editor needs
 * a real URL to render. An abandoned edit therefore orphans the object in R2 —
 * accepted, and swept by the tenant purge (see the backend service).
 */
export function ImageButton({
  editor,
  scope,
  disabled,
}: {
  editor: Editor | null;
  scope: RichImageScope;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file || !editor) return;
    if (file.size > RICH_IMAGE_MAX_BYTES) {
      toast.error(
        `That image is too large — keep it under ${Math.round(
          RICH_IMAGE_MAX_BYTES / (1024 * 1024),
        )}MB.`,
      );
      return;
    }
    setBusy(true);
    try {
      const res = await RICH_IMAGE_UPLOADERS[scope](file);
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
