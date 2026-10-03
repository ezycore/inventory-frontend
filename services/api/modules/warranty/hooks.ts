// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { createResourceHooks, handleMutationSuccess } from "../query-helpers";
import {
  warrantyApi,
  type CreateWarrantyClaimInput,
  type UpdateWarrantyClaimStatusInput,
  type WarrantyClaimListParams,
} from "./api";

/**
 * Warranty hooks — the counter lookup and claims (backend `docs/features/warranty.md`).
 * Reads from the shared factory; writes declare their domain event.
 */
const claimHooks = createResourceHooks(
  { getAll: warrantyApi.getAll, getById: warrantyApi.getById },
  queryKeys.warranty,
);

export const useWarrantyClaims = (filters?: WarrantyClaimListParams) =>
  claimHooks.useList!(filters);
export const useWarrantyClaim = claimHooks.useDetail!;

/** "Is this still covered?" — runs only once something has been typed. */
export function useWarrantyLookup(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.warranty.lookup(query),
    queryFn: () => warrantyApi.lookup(query),
    select: (data) => data.data ?? [],
    enabled: query.length > 0,
  });
}

export function useCreateWarrantyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWarrantyClaimInput) => warrantyApi.create(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Warranty claim created");
      invalidate(qc, "warranty.claimed");
    },
    onError: handleMutationError,
  });
}

export function useUpdateWarrantyClaimStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateWarrantyClaimStatusInput & { id: string }) =>
      warrantyApi.updateStatus(id, data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Warranty claim updated");
      invalidate(qc, "warranty.claimed");
    },
    onError: handleMutationError,
  });
}

/** Hand a replacement out of stock — moves inventory, so it dirties stock too. */
export function useReplaceWarrantyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => warrantyApi.replace(id, { note }),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Replacement handed over");
      invalidate(qc, "warranty.replaced");
    },
    onError: handleMutationError,
  });
}
