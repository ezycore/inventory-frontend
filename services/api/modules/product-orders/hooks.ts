// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import { productOrdersApi, type ProductOrderTarget } from "./api";

const keyOf = (target: ProductOrderTarget) =>
  queryKeys.storefrontCatalog.productOrder(target.scope, target.scope === "all" ? undefined : target.id);

/** Which listings carry a saved order — the "Custom order" badges. */
export const useProductOrderSummary = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.storefrontCatalog.productOrders(),
    queryFn: () => productOrdersApi.summary(),
    select: (r) => r.data,
    enabled,
  });

/** One listing's arrangement: the placed products, then the rest in today's order. */
export const useProductOrder = (target: ProductOrderTarget) =>
  useQuery({
    queryKey: keyOf(target),
    queryFn: () => productOrdersApi.get(target),
    select: (r) => r.data,
  });

/**
 * Saves or resets an arrangement. The answer is what the server stored, so it
 * seeds the cache directly — no flash back to the old order while the refetch
 * runs. `storefront.catalog.changed` also expires the shop's cached pages, which
 * is what makes the new order reach shoppers straight away rather than after the
 * storefront cache lapses.
 */
const useProductOrderMutation = (
  target: ProductOrderTarget,
  run: (productIds?: string[]) => ReturnType<typeof productOrdersApi.get>,
  fallbackMessage: string,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (res) => {
      if (res.data) qc.setQueryData(keyOf(target), res);
      handleMutationSuccess(res.message || fallbackMessage);
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useSaveProductOrder = (target: ProductOrderTarget) =>
  useProductOrderMutation(
    target,
    (productIds) => productOrdersApi.save(target, productIds ?? []),
    "Product order saved",
  );

export const useResetProductOrder = (target: ProductOrderTarget) =>
  useProductOrderMutation(target, () => productOrdersApi.reset(target), "Product order reset");
