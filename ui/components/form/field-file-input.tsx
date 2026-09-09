// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { ImageRatioNotice } from "@/components/shared/image-ratio-warning";
import {
  GalleryItemRow,
  describeGalleryEntry,
} from "@/components/shared/gallery-item-row";
import { moveGalleryEntry, replaceGalleryEntry } from "@/lib/image-gallery-order";
import { Upload } from "lucide-react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
} from "../file-upload";
import type { FieldRenderContext } from "./field-render-context";

/** `file-upload` — dropzone + preview list; single- or multi-file. */
export function renderFileUpload(ctx: FieldRenderContext): ReactNode {
  const { field, control, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => {
        let files: (File | string | any)[] = controllerField.value || [];

        // Normalize to array format
        if (!Array.isArray(files)) {
          files = files ? [files] : [];
        }

        const acceptedTypes = field.accept || "*";
        const maxFiles = field.maxFiles || 1;
        const maxSize = field.maxSize || 5 * 1024 * 1024; // 5MB default
        const showPreview = field.showPreview !== false;
        const hasFiles = files.length > 0;
        const isSingleFileMode = maxFiles === 1;
        const shouldHideDropzone = isSingleFileMode && hasFiles;

        const handleFileChange = (selectedFiles: (File | string)[]) => {
          controllerField.onChange(selectedFiles);
          handleChange(selectedFiles);
        };
        return (
          <FileUpload
            value={files}
            onValueChange={handleFileChange}
            accept={acceptedTypes}
            maxFiles={maxFiles}
            maxSize={maxSize}
            multiple={field.multiple}
            disabled={field.disabled}
          >
            {!shouldHideDropzone && (
              <FileUploadDropzone className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-semibold text-primary">
                      Click to upload
                    </span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {field.dropzoneText ||
                      `${acceptedTypes.toUpperCase()} up to ${(
                        maxSize /
                        1024 /
                        1024
                      ).toFixed(0)}MB ${maxFiles > 1 ? `(Max ${maxFiles} files)` : ""}`}
                  </p>
                </div>
              </FileUploadDropzone>
            )}

            {/* Advisory only — a wrong-shaped file still uploads. */}
            <ImageRatioNotice files={files} recommended={field.recommended} />

            {shouldHideDropzone && (
              <div className="text-sm text-muted-foreground mb-2">
                Remove the existing file to upload a new one
              </div>
            )}

            {showPreview && files.length > 0 && (
              <FileUploadList className="mt-4">
                {files.map((file: any, index: number) => {
                  if (
                    !(file instanceof File) &&
                    typeof file !== "string" &&
                    !(file && typeof file === "object")
                  ) {
                    return null;
                  }
                  const { key, fileName, fileSize, previewUrl } =
                    describeGalleryEntry(file, index);
                  return (
                    <GalleryItemRow
                      key={key}
                      value={file}
                      previewUrl={previewUrl}
                      fileName={fileName}
                      fileSize={fileSize}
                      index={index}
                      count={files.length}
                      showOrdering={maxFiles > 1}
                      onMove={(from, to) =>
                        handleFileChange(
                          moveGalleryEntry(files, from, to) as (File | string)[],
                        )
                      }
                      onReplace={(at, replacement) =>
                        handleFileChange(
                          replaceGalleryEntry(files, at, replacement) as (
                            | File
                            | string
                          )[],
                        )
                      }
                      accept={acceptedTypes}
                      maxSize={maxSize}
                    />
                  );
                })}
              </FileUploadList>
            )}

          </FileUpload>
        );
      }}
    />
  );
}
