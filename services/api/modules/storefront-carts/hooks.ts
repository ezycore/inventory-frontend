import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontCartsApi, type AbandonedCartsParams } from "./api";

/**
 * Abandoned-cart reads. Both are pure queries — this resource has no mutations,
 * so it declares no invalidation (see `services/api/invalidation.ts`); carts are
 * written by shoppers on the storefront, never from the admin.
 *
 * The data therefore goes stale on its own schedule rather than on an event, so
 * these keep the global 1-minute `staleTime` instead of asking for a longer one:
 * a merchant watching this page wants the live number.
 */
export const useAbandonedCarts = (params: AbandonedCartsParams = {}) =>
  useQuery({
    queryKey: queryKeys.storefrontCarts.list(params),
    queryFn: () => storefrontCartsApi.list(params),
    // Keep the previous page on screen while the next one loads — without it the
    // table collapses to a spinner on every page change.
    placeholderData: keepPreviousData,
    select: (r) => r.data,
  });

export const useCartFunnelStats = (days?: number) =>
  useQuery({
    queryKey: queryKeys.storefrontCarts.stats(days),
    queryFn: () => storefrontCartsApi.stats(days),
    select: (r) => r.data,
  });
