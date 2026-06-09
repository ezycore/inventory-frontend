import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/services/api/query-keys";
import type { ApiResponse } from "@/types";
import { barcodeApi, type BarcodeLookupResult } from "./api";

/**
 * Reactive lookup hook — pass a `code` (or null/empty to disable).
 * `staleTime: 0` and `retry: false` because every scan is a fresh, exact match.
 */
export function useBarcodeLookup(code: string | null | undefined) {
  return useQuery<ApiResponse<BarcodeLookupResult>, ApiError, BarcodeLookupResult>({
    queryKey: queryKeys.barcode.lookup(code || ""),
    queryFn: () => barcodeApi.lookup(code as string),
    enabled: !!code,
    staleTime: 0,
    retry: false,
    select: (res) => res.data,
  });
}

/**
 * Imperative variant — call `lookup(code)` from event handlers (scanner input).
 * Uses the QueryClient cache so repeated scans of the same code are instant.
 */
export function useBarcodeLookupAction() {
  const qc = useQueryClient();
  return useCallback(
    async (code: string): Promise<BarcodeLookupResult> => {
      const data = await qc.fetchQuery({
        queryKey: queryKeys.barcode.lookup(code),
        queryFn: () => barcodeApi.lookup(code),
        staleTime: 30_000,
        retry: false,
      });
      return data.data;
    },
    [qc],
  );
}
