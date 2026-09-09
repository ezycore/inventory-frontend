"use client";
// coding-standard: maintained

import { Upload } from "lucide-react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
} from "@/ui/components/file-upload";
import {
  GalleryItemRow,
  describeGalleryEntry,
} from "@/components/shared/gallery-item-row";
import { ImageRatioNotice } from "@/components/shared/image-ratio-warning";
import { StorageNotice } from "@/components/shared/storage-warning";
import { moveGalleryEntry, replaceGalleryEntry } from "@/lib/image-gallery-order";
import type { ImageSize } from "@/lib/image-ratio";

/** An already-uploaded image (server shape) — anything not a `File`. */
export interface UploadedImage {
  url?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  publicId?: string;
}

export type GalleryImage = File | UploadedImage;

/** Stable string identity handed to the file-upload primitive for uploads. */
const uploadedKey = (img: UploadedImage): string =>
  img.url || img.mediumUrl || img.thumbnailUrl || img.publicId || "";

interface ImageGalleryUploadProps {
  value: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  dropzoneText?: string;
  disabled?: boolean;
  /** Shape this gallery is built for; omit to leave the field unchanged. */
  recommended?: ImageSize;
}

/**
 * Image gallery uploader mirroring the product form's `file-upload` field, but
 * usable standalone (controlled `value`/`onChange`) outside DynamicForm. Items
 * are a mix of new `File`s and existing image objects (`{ url, publicId, ... }`).
 * The first image is the primary one.
 */
export function ImageGalleryUpload({
  value,
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  accept = "image/*",
  dropzoneText,
  disabled,
  recommended,
}: ImageGalleryUploadProps) {
  const files: GalleryImage[] = Array.isArray(value) ? value : [];
  const isSingleFileMode = maxFiles === 1;
  const shouldHideDropzone = isSingleFileMode && files.length > 0;

  // The file-upload primitive only understands `File | string` (string =
  // existing upload), so uploaded-image objects travel as their URL string and
  // are mapped back to the original objects on change.
  const byKey = new Map(
    files.flatMap((f) =>
      f instanceof File ? [] : [[uploadedKey(f), f] as const],
    ),
  );
  const primitiveValue = files.map((f) =>
    f instanceof File ? f : uploadedKey(f),
  );
  const handleValueChange = (next: (File | string)[]) =>
    onChange(
      next.map((f) => (f instanceof File ? f : (byKey.get(f) ?? { url: f }))),
    );

  return (
    <FileUpload
      value={primitiveValue}
      onValueChange={handleValueChange}
      accept={accept}
      maxFiles={maxFiles}
      maxSize={maxSize}
      multiple={maxFiles > 1}
      disabled={disabled}
    >
      {!shouldHideDropzone && (
        <FileUploadDropzone className="rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary">
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-semibold text-primary">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {dropzoneText ||
                `PNG, JPG, WEBP up to ${(maxSize / 1024 / 1024).toFixed(0)}MB${
                  maxFiles > 1 ? ` · Max ${maxFiles} images` : ""
                }`}
            </p>
          </div>
        </FileUploadDropzone>
      )}

      {/* Advisory only — a wrong-shaped file still uploads. */}
      <ImageRatioNotice files={files} recommended={recommended} />

      {/* Not advisory — past the cap the upload is refused server-side. */}
      <StorageNotice />

      {files.length > 0 && (
        <FileUploadList className="mt-4">
          {files.map((file, index) => {
            const { key, fileName, fileSize, previewUrl } =
              describeGalleryEntry(file, index);
            return (
              <GalleryItemRow
                key={key}
                value={file instanceof File ? file : uploadedKey(file)}
                previewUrl={previewUrl}
                fileName={fileName}
                fileSize={fileSize}
                index={index}
                count={files.length}
                showOrdering={maxFiles > 1}
                onMove={(from, to) => onChange(moveGalleryEntry(files, from, to))}
                onReplace={(at, file) =>
                  onChange(replaceGalleryEntry(files, at, file))
                }
                accept={accept}
                maxSize={maxSize}
              />
            );
          })}
        </FileUploadList>
      )}
    </FileUpload>
  );
}
