"use client";
// coding-standard: maintained

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/ui/components/button";
import {
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemPreview,
} from "@/ui/components/file-upload";
import { SafeImage } from "@/ui/components/safeImage";
import { isFileAccepted } from "@/lib/file-accept";

/**
 * One row of an image gallery: thumbnail, name, the Primary badge, replace,
 * reorder arrows, delete.
 *
 * It exists because there were three byte-for-byte copies of this markup —
 * `renderFileUpload` (the DynamicForm `file-upload` field, used by the product
 * form), `ImageGalleryUpload` (the online-store editor) and the variant editor
 * in `variant-manager.tsx`. The three hosts still differ in how they talk to
 * the `FileUpload` primitive (react-hook-form, plain controlled state, and
 * per-variant draft state), so the ROW is shared and the wiring is not.
 *
 * **Replace is the point of the row, not the arrows.** Swapping one picture
 * used to mean delete → upload → walk the new file back up the list with the
 * arrows, which is a workaround dressed as a feature. `onReplace` swaps the
 * entry in its slot in one click, and the order manifest carries the slot to
 * the server unchanged.
 *
 * The arrows are buttons rather than drag-and-drop: the repo has no DnD
 * dependency, a gallery is at most five items, and buttons work on a phone and
 * with a keyboard — which is what a merchant reordering a shop on a mobile
 * actually has. `menu-item-fields` and `hero-slides-panel` use the same
 * ArrowUp/ArrowDown idiom, so it is the established pattern here.
 */
export interface GalleryItemRowProps {
  /** The value the `FileUpload` primitive knows this row by. */
  value: File | string;
  previewUrl: string | null;
  fileName: string;
  /** "2.4 MB" for a new pick, "Uploaded" for one already stored. */
  fileSize: string;
  index: number;
  count: number;
  /** Multi-image galleries show the Primary badge and the arrows; single don't. */
  showOrdering: boolean;
  onMove?: (from: number, to: number) => void;
  /** Swap this slot's picture. Omit to hide the replace control. */
  onReplace?: (index: number, file: File) => void;
  /** Mirrors the host `FileUpload`, so a replacement is held to the same rules. */
  accept?: string;
  maxSize?: number;
  /**
   * Override the rejection toast. Omit and the row reports it itself — a
   * replace that silently does nothing reads as a broken button, which is
   * exactly how the `.avif` case presented in browser QA.
   */
  onFileReject?: (file: File, message: string) => void;
  /** Denser row for the variant editor's narrower panel. */
  compact?: boolean;
}

export function GalleryItemRow({
  value,
  previewUrl,
  fileName,
  fileSize,
  index,
  count,
  showOrdering,
  onMove,
  onReplace,
  accept = "image/*",
  maxSize,
  onFileReject,
  compact,
}: GalleryItemRowProps) {
  const t = useTranslations("common.gallery");
  const replaceRef = useRef<HTMLInputElement>(null);
  const canReorder = showOrdering && !!onMove && count > 1;
  const thumb = compact ? "h-12 w-12" : "h-16 w-16";
  const control = compact ? "h-7 w-7" : "h-8 w-8";

  /**
   * Validate here rather than leaning on the `FileUpload` primitive: a replace
   * never goes through its input, so its accept/size checks never run on this
   * file. Skipping them would make the one path that bypasses the primitive the
   * one path with no limits — a 40 MB replacement would upload where a 40 MB
   * add is refused.
   */
  const reject = (file: File, key: "rejectedType" | "rejectedSize") => {
    if (onFileReject) {
      onFileReject(file, key === "rejectedSize" ? "File too large" : "File type not accepted");
      return;
    }
    // The row knows WHICH check failed, so it can say so in the merchant's
    // language rather than surfacing the primitive's English string.
    toast.error(t(key, { name: file.name }));
  };

  const handleReplace = (file: File | undefined) => {
    if (!file) return;
    if (!isFileAccepted(file, accept)) {
      reject(file, "rejectedType");
      return;
    }
    if (maxSize && file.size > maxSize) {
      reject(file, "rejectedSize");
      return;
    }
    onReplace?.(index, file);
  };

  return (
    <FileUploadItem
      value={value}
      className={`flex items-center gap-3 rounded-lg border ${compact ? "p-2" : "p-3"}`}
    >
      {previewUrl ? (
        <SafeImage
          src={previewUrl}
          alt={fileName}
          className={`${thumb} rounded bg-gray-100 object-cover`}
        />
      ) : (
        <FileUploadItemPreview
          className={`${thumb} overflow-hidden rounded bg-gray-100`}
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-xs text-muted-foreground">{fileSize}</p>
        {index === 0 && showOrdering && (
          <span className="mt-1 inline-block rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {t("primary")}
          </span>
        )}
      </div>

      <div className="flex items-center">
        {onReplace && (
          <>
            {/* Its own input, not the gallery's: the gallery's input ADDS, and
                routing a replacement through it would append the file and leave
                the old one in place — the exact bug this control removes. */}
            <input
              ref={replaceRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(event) => {
                handleReplace(event.target.files?.[0]);
                // Clear it, or picking the same file twice fires no change.
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`${control} p-0`}
              aria-label={t("replace", { name: fileName })}
              onClick={() => replaceRef.current?.click()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        )}

        {canReorder && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`${control} p-0`}
              disabled={index === 0}
              // At position 1 the label says what the move MEANS: moving to the
              // top is the only way to set the cover image, and nothing else on
              // the row says so.
              aria-label={
                index === 1
                  ? t("makePrimary")
                  : t("moveEarlier", { name: fileName })
              }
              onClick={() => onMove?.(index, index - 1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`${control} p-0`}
              disabled={index === count - 1}
              aria-label={t("moveLater", { name: fileName })}
              onClick={() => onMove?.(index, index + 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </>
        )}

        <FileUploadItemDelete asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`${control} p-0`}
            aria-label={t("remove", { name: fileName })}
          >
            <X className="h-4 w-4" />
          </Button>
        </FileUploadItemDelete>
      </div>
    </FileUploadItem>
  );
}

/** Labels for entries whose name/size are not the file's own. */
export interface GalleryEntryLabels {
  existingImage: string;
  uploaded: string;
}

/** Thumbnail, display name and size for a gallery entry, whatever its shape. */
export const describeGalleryEntry = (
  entry: File | string | { publicId?: string; url?: string; thumbnailUrl?: string },
  index: number,
  labels?: GalleryEntryLabels,
): { key: string; fileName: string; fileSize: string; previewUrl: string | null } => {
  const existingImage = labels?.existingImage ?? "Existing image";
  const uploaded = labels?.uploaded ?? "Uploaded";

  if (entry instanceof File) {
    return {
      key: `${entry.name}-${index}`,
      fileName: entry.name,
      fileSize: `${(entry.size / 1024 / 1024).toFixed(2)} MB`,
      previewUrl: URL.createObjectURL(entry),
    };
  }
  if (typeof entry === "string") {
    return {
      key: `${entry}-${index}`,
      fileName: entry.split("/").pop() || existingImage,
      fileSize: uploaded,
      previewUrl: entry,
    };
  }
  return {
    key: `${entry?.publicId || index}-${index}`,
    fileName: entry?.publicId?.split("/").pop() || existingImage,
    fileSize: uploaded,
    previewUrl: entry?.thumbnailUrl || entry?.url || null,
  };
};
