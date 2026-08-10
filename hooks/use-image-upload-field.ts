"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";

/** `null` = no pending change. `File` = upload pending. `"remove"` = clear pending. */
export type PendingImage = File | "remove" | null;

/** Must match the backend `uploadConfig` limit (`src/middleware/upload.ts`). */
export const MAX_IMAGE_UPLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Exactly what the backend's multer `imageFilter` accepts.
 *
 * `.ico` is absent on purpose: `image/x-icon` is not on the server's allow-list,
 * sharp cannot decode it, and every upload is re-encoded to webp anyway — so
 * offering it here would let someone pick a file that fails after the fact.
 */
export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif";

/** Why a chosen file was refused, so the caller can pick the message. */
export type ImageRejection = "type" | "size";

/**
 * Pending-upload state for one image field: the staged file (or a staged
 * removal), a blob preview that is revoked when it falls out of scope, and the
 * URL that should be displayed right now.
 *
 * Extracted when the organization settings tab grew a second image field
 * (logo + favicon). The blob-URL lifecycle is the part worth owning once — a
 * missed `revokeObjectURL` leaks for the life of the document, and that is
 * exactly the kind of thing a copy-pasted second uploader drops.
 *
 * Validation reports *why* it refused rather than rendering a message itself,
 * because the two fields sit under different message keys and this hook has no
 * business knowing which namespace called it.
 */
export function useImageUploadField(savedUrl?: string | null) {
  const [pending, setPending] = useState<PendingImage>(null);

  // Derived rather than held in state and assigned from an effect (which is
  // what `react-hooks/set-state-in-effect` rejects, and what the inline version
  // of this did). Computing the URL during render means `preview` can never
  // disagree with `pending` for a frame; the effect below exists only to revoke,
  // keyed on the URL itself so a superseded one is released before the next.
  const preview = useMemo(
    () => (pending instanceof File ? URL.createObjectURL(pending) : null),
    [pending],
  );

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const select = (
    file: File | undefined,
    onReject: (reason: ImageRejection) => void,
  ): void => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onReject("type");
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      onReject("size");
      return;
    }
    setPending(file);
  };

  return {
    pending,
    /** What to render now: the staged file's preview, else the saved image. */
    currentUrl: pending === "remove" ? null : (preview ?? savedUrl ?? null),
    select,
    remove: () => setPending("remove"),
    /** Drop the staged change — used both by Cancel and after a successful save. */
    clear: () => setPending(null),
  };
}
