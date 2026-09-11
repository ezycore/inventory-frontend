// coding-standard: maintained
import type { ReactNode } from "react";
import { ContentBodyView } from "@/components/storefront/content-body-view";
import { SafeImage } from "@/ui/components/safeImage";
import type { FormFieldConfig } from "./type";

/**
 * Read-only display of a field's value (viewMode). Rich text renders through
 * the storefront body renderer; files render as a thumbnail list; everything
 * else falls back to plain text.
 */
export function renderFieldViewMode(
  field: FormFieldConfig,
  fieldValue: any,
): ReactNode {
  let displayValue = fieldValue;

  if (field.type === "richtext") {
    // Storefront-var → admin-token mapping so the storefront body renderer
    // reads correctly against the admin theme.
    const themeBridge = {
      "--text": "var(--foreground)",
      "--muted": "var(--muted-foreground)",
      "--faint": "var(--muted-foreground)",
    } as React.CSSProperties;
    return (
      <div style={themeBridge}>
        <ContentBodyView
          body={typeof fieldValue === "string" ? fieldValue : ""}
          legacyFormat={field.legacyFormat}
        />
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    const option = field.options.find((opt) => opt.value === fieldValue);
    displayValue = option?.label || fieldValue;
  } else if (field.type === "checkbox") {
    displayValue = fieldValue ? "Yes" : "No";
  } else if (field.type === "file-upload") {
    if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
      return <p className="text-sm text-muted-foreground">No file uploaded</p>;
    }

    const files = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

    return (
      <div className="space-y-2">
        {files.map((file: any, index: number) => {
          let displayUrl: string | null = null;
          let displayName = "Uploaded file";

          if (typeof file === "string") {
            displayUrl = file;
            displayName = file.split("/").pop() || "Existing file";
          } else if (file instanceof File) {
            displayUrl = URL.createObjectURL(file);
            displayName = file.name;
          } else if (file && typeof file === "object") {
            // Image interface: { url, thumbnailUrl?, mediumUrl?, publicId }
            displayUrl = file.thumbnailUrl || file.url;
            displayName = file.publicId?.split("/").pop() || "Existing file";
          }

          if (!displayUrl) return null;

          return (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <SafeImage
                src={displayUrl}
                alt={displayName}
                className="h-16 w-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground">Uploaded</p>
              </div>
              {typeof file === "string" || (file && file.url) ? (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">{displayValue || "-"}</p>;
}
