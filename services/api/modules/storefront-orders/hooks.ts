import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import {
  couriersApi,
  storefrontOrdersApi,
  type AdminOrderListParams,
} from "./api";

export const useStorefrontOrders = (params: AdminOrderListParams) =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.list(params),
    queryFn: () => storefrontOrdersApi.list(params),
    select: (r) => r.data,
    placeholderData: (prev) => prev,
  });

/** The stat-card snapshot — under the orders root, so any order mutation refreshes it. */
export const useOrderStats = () =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.stats(),
    queryFn: () => storefrontOrdersApi.stats(),
    select: (r) => r.data,
  });

export const useStorefrontOrder = (id: string) =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.detail(id),
    queryFn: () => storefrontOrdersApi.get(id),
    enabled: !!id,
    select: (r) => r.data,
  });

/**
 * On-demand delivery-risk lookup (runs when the merchant clicks the button,
 * not on mount) — modeled as a mutation so the result is fetched lazily.
 */
export const useOrderFraudScore = () =>
  useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.fraudScore(id),
    onError: handleMutationError,
  });

export const useConfirmOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.confirm(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order confirmed");
      invalidate(qc, "order.confirmed");
    },
    onError: handleMutationError,
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: string }) =>
      storefrontOrdersApi.updateStatus(v.id, v.status),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Status updated");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      reject?: boolean;
      refundAdvance?: boolean;
      accountId?: string;
    }) =>
      storefrontOrdersApi.cancel(v.id, {
        reject: v.reject,
        refundAdvance: v.refundAdvance,
        accountId: v.accountId,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order cancelled");
      invalidate(qc, "order.returned");
    },
    onError: handleMutationError,
  });
};

/** Record a COD delivery-charge advance (collected before shipping). */
export const useRecordAdvance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; amount: number; accountId?: string }) =>
      storefrontOrdersApi.recordAdvance(v.id, v.amount, v.accountId),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Advance recorded");
      invalidate(qc, "order.settled");
    },
    onError: handleMutationError,
  });
};

export const useUpdateCourierCost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; shippingCost: number }) =>
      storefrontOrdersApi.updateCourierCost(v.id, v.shippingCost),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier cost updated");
      invalidate(qc, "order.settled");
    },
    onError: handleMutationError,
  });
};

export const useMarkOrderPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; accountId?: string }) =>
      storefrontOrdersApi.markPaid(v.id, v.accountId),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Payment recorded");
      invalidate(qc, "order.settled");
    },
    onError: handleMutationError,
  });
};

export const useReturnOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      returnCharge?: number;
      collectedAmount?: number;
      accountId?: string;
      refund?: { mode: "account" | "credit"; accountId?: string };
    }) =>
      storefrontOrdersApi.returnOrder(v.id, {
        returnCharge: v.returnCharge,
        collectedAmount: v.collectedAmount,
        accountId: v.accountId,
        refund: v.refund,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order returned");
      invalidate(qc, "order.returned");
    },
    onError: handleMutationError,
  });
};

export const useCreateConsignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; provider: string }) =>
      storefrontOrdersApi.createConsignment(v.id, v.provider),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Consignment created");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

export const useRefreshTracking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.refreshTracking(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Tracking refreshed");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

// Map an order's canonical address to a provider's location codes before dispatch.
export const useResolveLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      provider: string;
      location: Record<string, string | number>;
    }) => storefrontOrdersApi.resolveLocation(v.id, v.provider, v.location),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Delivery location resolved");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

// A pre-dispatch delivery-price quote (no cache change — read-only).
export const useCourierPrice = () =>
  useMutation({
    mutationFn: (v: { id: string; provider: string }) =>
      storefrontOrdersApi.courierPrice(v.id, v.provider),
    onError: handleMutationError,
  });

// Bulk dispatch: one call for many orders. Toast is left to the caller (it
// summarizes the multi-status result), but the orders list is refreshed here.
export const useBulkConsignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { orderIds: string[]; provider: string }) =>
      storefrontOrdersApi.bulkConsignment(v.orderIds, v.provider),
    onSuccess: () => invalidate(qc, "order.changed"),
    onError: handleMutationError,
  });
};

// --- Courier config ---
export const useCouriers = () =>
  useQuery({
    queryKey: queryKeys.couriers.list(),
    queryFn: () => couriersApi.list(),
    select: (r) => r.data,
  });

export const useUpsertCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      provider: string;
      credentials?: Record<string, string>;
      mode?: string;
      enabled?: boolean;
    }) =>
      couriersApi.upsert(v.provider, {
        credentials: v.credentials,
        mode: v.mode,
        enabled: v.enabled,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier saved");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};

export const useTestCourier = () =>
  useMutation({
    mutationFn: (provider: string) => couriersApi.test(provider),
    onSuccess: (res) => handleMutationSuccess(res.message || "Connection ok"),
    onError: handleMutationError,
  });

// Button-triggered fetch of the merchant's provider stores (for the store picker).
export const useCourierStores = () =>
  useMutation({
    mutationFn: (provider: string) => couriersApi.stores(provider),
    onError: handleMutationError,
  });

// Button-triggered fetch of the merchant's provider packages (eCourier picker).
export const useCourierPackages = () =>
  useMutation({
    mutationFn: (provider: string) => couriersApi.packages(provider),
    onError: handleMutationError,
  });

// The store's delivery-status webhook token + per-provider URLs (ensured on read).
export const useCourierWebhook = () =>
  useQuery({
    queryKey: queryKeys.couriers.webhook(),
    queryFn: () => couriersApi.webhook(),
  });

export const useRegenerateWebhookToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => couriersApi.regenerateWebhook(),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Webhook URL regenerated");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.webhook() });
    },
    onError: handleMutationError,
  });
};

export const useDeleteCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => couriersApi.remove(provider),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier removed");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};
