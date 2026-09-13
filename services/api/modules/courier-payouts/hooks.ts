// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { createResourceHooks, handleMutationSuccess } from "../query-helpers";
import {
  courierPayoutsApi,
  type CourierPayoutListParams,
  type RecordCourierPayoutInput,
} from "./api";

/**
 * Courier remittance hooks.
 *
 * The reads come from the shared factory; the writes are hand-rolled because **recording and
 * posting dirty different things**. Filing a statement moves no money (`payout.recorded`);
 * posting it writes a transfer and several expenses (`payout.posted`, which carries the whole
 * `MONEY` group). One coarse event covering both would refetch the entire ledger on a filing
 * that touched none of it — and, worse in the other direction, would tempt reusing
 * `order.settled`, which does not name the payouts root at all.
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
 * The four P4 questions in one request: what the couriers are holding (with ageing), quoted vs
 * actual charge variance, delivery margin, and payout history.
 *
 * Keyed under the payouts root, so posting a payout drops it along with the list.
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

/** File a courier's statement. Records only — see `usePostCourierPayout` for the money. */
export function useRecordCourierPayout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordCourierPayoutInput) =>
      courierPayoutsApi.create(data),
    onSuccess: (result, variables) => {
      handleMutationSuccess(result.message || "Payout recorded");
      // `post: true` is a supported shortcut on the endpoint, so the event has to follow
      // what actually happened rather than what this hook is usually used for.
      invalidate(
        qc,
        variables.post ? "payout.posted" : "payout.recorded",
      );
    },
    onError: handleMutationError,
  });
}

/**
 * Post a recorded payout into the ledger.
 *
 * `accountId` is where the net landed — the merchant's bank or bKash, never a clearing
 * account (the payment-options endpoint excludes system accounts, so one cannot be offered).
 */
export function usePostCourierPayout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accountId }: { id: string; accountId: string }) =>
      courierPayoutsApi.post(id, { accountId }),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Payout posted to the ledger");
      invalidate(qc, "payout.posted");
    },
    onError: handleMutationError,
  });
}

/**
 * Pull remittances from the couriers. Writes payout records and posts nothing, so it is a
 * `payout.recorded` even though the merchant experiences it as a refresh.
 */
export function useSyncCourierPayouts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data?: { provider?: string; since?: string }) =>
      courierPayoutsApi.sync(data),
    onSuccess: (result) => {
      const recorded = (result.data?.results ?? []).reduce(
        (sum, row) => sum + (row.recorded ?? 0),
        0,
      );
      handleMutationSuccess(
        recorded > 0
          ? `${recorded} new payout${recorded === 1 ? "" : "s"} recorded`
          : "No new payouts — everything the couriers report is already on file",
      );
      invalidate(qc, "payout.recorded");
    },
    onError: handleMutationError,
  });
}
