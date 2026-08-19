// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { ImageRatioNotice } from "@/components/shared/image-ratio-warning";
import { Upload, X } from "lucide-react";
import { Button } from "../button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemPreview,
  FileUploadList,
} from "../file-upload";
import { SafeImage } from "@/ui/components/safeImage";
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
                  let fileKey: string;
                  let fileName: string;
                  let fileSize: string;
                  let previewUrl: string | null = null;

                  if (file instanceof File) {
                    // New File object
                    fileKey = `${file.name}-${index}`;
                    fileName = file.name;
                    fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                    previewUrl = URL.createObjectURL(file);
                  } else if (typeof file === "string") {
                    // Simple string URL
                    fileKey = `${file}-${index}`;
                    fileName = file.split("/").pop() || "Existing file";
                    fileSize = "Uploaded";
                    previewUrl = file;
                  } else if (file && typeof file === "object") {
                    // Image interface: { url, thumbnailUrl?, mediumUrl?, publicId }
                    fileKey = `${file.publicId || index}-${index}`;
                    fileName = file.publicId?.split("/").pop() || "Existing file";
                    fileSize = "Uploaded";
                    previewUrl = file.thumbnailUrl || file.url;
                  } else {
                    return null;
                  }

                  return (
                    <FileUploadItem
                      key={fileKey}
                      value={file}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      {previewUrl ? (
                        <SafeImage
                          src={previewUrl}
                          alt={fileName}
                          className="h-16 w-16 rounded object-cover bg-gray-100"
                        />
                      ) : (
                        <FileUploadItemPreview className="h-16 w-16 rounded overflow-hidden bg-gray-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground">{fileSize}</p>
                        {index === 0 && maxFiles > 1 && (
                          <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <FileUploadItemDelete asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
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
