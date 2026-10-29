// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ImportBatch } from "@/types/api";
import { buildQueryParams } from "../../utils";

/** Which import a history row came from (backend `import-batch.service.ts`). */
export type ImportResource = "products" | "inventory" | "customers" | "suppliers" | "product-taxonomy";

export interface ImportBatchFilters {
  page?: number;
  limit?: number;
  resource?: ImportResource;
}

/**
 * The import history (backend `docs/plan/import-export-center.md`). Read-only:
 * a row is written by the backend on every committed import, and the backend
 * narrows it to the imports the signed-in user may run.
 */
export const importBatchesApi = {
  list: (filters: ImportBatchFilters = {}): Promise<ApiResponse<PaginatedResponse<ImportBatch>>> =>
    apiClient.get(`/import-batches${buildQueryParams(filters)}`),
};
