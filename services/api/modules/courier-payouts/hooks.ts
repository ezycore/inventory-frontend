// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { createResourceHooks, handleMutationSuccess } from "../query-helpers";
import {
  courierPayoutsApi,
  type CourierPayoutListParams,
  type RecordCourierPaymentInput,
  type WriteOffCourierShortfallInput,
} from "./api";

/**
 * Courier settlement hooks — one manual flow for every courier (backend
 * `docs/plan/courier-settlement-manual.md`).
 *
 * The reads come from the shared factory; the writes are hand-rolled. Recording a payment
 * posts it in the same call, so both writes are `payout.posted`, which carries the whole
 * `MONEY` group.
 */
const payoutHooks = createResourceHooks(
  {
    getAll: courierPayoutsApi.getAll,
    getById: courierPayoutsApi.getById,
  },
  queryKeys.courierPayouts,
);

export const useCourierPayouts = (filters?: CourierPayoutListParams) =>
  payoutHooks.useList!(filters);
export const useCourierPayout = payoutHooks.useDetail!;

/**
 * Charge variance, delivery margin and payment history in one request.
 *
 * Keyed under the payouts root, so recording a payment drops it along with the list.
 */
export function useCourierMoneySummary(
  filters?: { startDate?: string; endDate?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.courierPayouts.summary(filters),
    queryFn: () => courierPayoutsApi.getSummary(filters),
    select: (data) => data.data,
    enabled,
  });
}

/** "Courier owes you" per courier, and the open parcels behind it (oldest first). */
export function useCourierBalances(enabled = true) {
  return useQuery({
    queryKey: queryKeys.courierPayouts.balances(),
    queryFn: () => courierPayoutsApi.getBalances(),
    select: (data) => data.data,
    enabled,
  });
}

/** Record a payment received from a courier — recorded and posted in one call. */
export function useRecordCourierPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordCourierPaymentInput) => courierPayoutsApi.create(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Payment recorded");
      invalidate(qc, "payout.posted");
    },
    onError: handleMutationError,
  });
}

/** Write off a courier's shortfall — takes it out of the clearing account as an expense. */
export function useWriteOffCourierShortfall() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: WriteOffCourierShortfallInput) => courierPayoutsApi.writeOff(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Shortfall written off");
      invalidate(qc, "payout.posted");
    },
    onError: handleMutationError,
  });
}
