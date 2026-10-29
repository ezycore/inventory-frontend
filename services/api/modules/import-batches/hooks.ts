// coding-standard: maintained
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/services/api/query-keys";

import { importBatchesApi, type ImportBatchFilters } from "./api";

/** One page of the import history, newest first. */
export function useImportBatches(filters: ImportBatchFilters = {}) {
  return useQuery({
    queryKey: queryKeys.importBatches.list({ ...filters }),
    queryFn: () => importBatchesApi.list(filters),
    select: (data) => data.data,
  });
}
