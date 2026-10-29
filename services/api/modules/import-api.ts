// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type {
  ImportColumnMapping,
  ImportOptions,
  ImportResult,
} from "@/types/DataTable";

/** FormData body for a CSV import call: the file, optional column mapping and switches. */
const buildImportForm = (
  file: File,
  mapping?: ImportColumnMapping,
  options?: ImportOptions,
): FormData => {
  const form = new FormData();
  form.append("file", file);
  if (mapping && Object.keys(mapping).length > 0) {
    form.append("mapping", JSON.stringify(mapping));
  }
  // Only switches that are ON are sent; the backend reads a missing one as off.
  if (options?.autoCreate) form.append("autoCreate", "true");
  if (options?.mirrorImages) form.append("mirrorImages", "true");
  return form;
};

/**
 * Build the standard CSV-import call pair for one resource endpoint
 * (`POST {basePath}/import?mode=preview|commit`). Spread into the resource's
 * api module so every import surface shares one request shape.
 */
export const createImportApi = (basePath: string) => ({
  importPreview: (
    file: File,
    mapping?: ImportColumnMapping,
    options?: ImportOptions,
  ): Promise<ImportResult> =>
    apiClient
      .post<ApiResponse<ImportResult>>(
        `${basePath}/import?mode=preview`,
        buildImportForm(file, mapping, options),
      )
      .then((res) => res.data),

  importCommit: (
    file: File,
    mapping?: ImportColumnMapping,
    options?: ImportOptions,
  ): Promise<ImportResult> =>
    apiClient
      .post<ApiResponse<ImportResult>>(
        `${basePath}/import?mode=commit`,
        buildImportForm(file, mapping, options),
      )
      .then((res) => res.data),
});
