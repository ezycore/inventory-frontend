// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { handleMutationSuccess } from "../query-helpers";
import { metaApi, type UpdateMetaSettingsBody } from "./api";

/**
 * Meta Pixel & Conversions API settings (backend `docs/plan/meta-pixel-capi.md`).
 *
 * Every mutation here seeds the cache from its own response rather than invalidating: the
 * backend answers each of them with the full masked settings object, so a refetch would be a
 * second request for data already in hand — and, on the token paths, a window in which the card
 * shows the pre-save state.
 */

/** GET /api/organization/storefront/meta — the masked config. Never carries the token. */
export const useGetMetaSettings = () =>
  useQuery({
    queryKey: queryKeys.organization.storefrontMeta(),
    queryFn: () => metaApi.get(),
    select: (r) => r.data,
  });

/**
 * PATCH /api/organization/storefront/meta
 *
 * Revalidates the storefront on success because the pixel id and the four browser-event
 * switches are rendered into the shop's own SSR HTML — without it a merchant who turns the
 * pixel on sees nothing happen until the page's cache expires.
 */
export const useUpdateMetaSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMetaSettingsBody) => metaApi.update(body),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Meta settings saved");
      queryClient.setQueryData(queryKeys.organization.storefrontMeta(), result);
      void revalidateStorefront();
    },
    onError: handleMutationError,
  });
};

/**
 * POST /api/organization/storefront/meta/test
 *
 * Deliberately does NOT seed the settings cache from its own response — it answers with the
 * test outcome, not the settings. It does invalidate, because a successful test stamps
 * `verifiedAt` server-side and that is what flips the card to "Connected".
 */
export const useTestMetaConnection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => metaApi.test(),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Test event delivered to Meta");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization.storefrontMeta(),
      });
    },
    onError: handleMutationError,
  });
};

/** DELETE /api/organization/storefront/meta/token — the only path that removes the token. */
export const useClearMetaToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => metaApi.clearToken(),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Access token removed");
      queryClient.setQueryData(queryKeys.organization.storefrontMeta(), result);
    },
    onError: handleMutationError,
  });
};

/**
 * GET /api/ecommerce/meta/events — what we told Meta, and why anything was skipped.
 *
 * A separate key root from the settings above: this is operational data that changes as orders
 * move, and it must not be flushed (or seeded) by a settings save.
 */
export const useMetaEvents = (params: {
  page?: number;
  limit?: number;
  status?: string;
  orderId?: string;
}) =>
  useQuery({
    queryKey: queryKeys.metaEvents.list(params),
    queryFn: () => metaApi.listEvents(params),
    select: (r) => r.data,
  });

/** POST /api/ecommerce/meta/events/:id/retry — requeue a dead-lettered event. */
export const useRetryMetaEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metaApi.retryEvent(id),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Event requeued");
      void invalidate(queryClient, "meta.eventRetried");
    },
    onError: handleMutationError,
  });
};

/**
 * PATCH /api/ecommerce/meta/orders/:id/exclude — the per-order escape hatch.
 *
 * Dirties the ORDERS keys as well as the events log: the order detail renders the flag, and the
 * events list gains a `skipped(excluded)` row the next time the order transitions.
 */
export const useSetOrderExcludedFromMeta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, excluded }: { orderId: string; excluded: boolean }) =>
      metaApi.setOrderExcluded(orderId, excluded),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Order updated");
      // Declared once in `invalidation.ts` rather than hand-listed here — two resources are
      // affected, and a call-site list is how the two drift apart.
      void invalidate(queryClient, "order.metaExclusionChanged");
    },
    onError: handleMutationError,
  });
};
