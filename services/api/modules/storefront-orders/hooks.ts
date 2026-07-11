import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { handleMutationSuccess } from "../query-helpers";
import { couriersApi, storefrontOrdersApi } from "./api";

const ROOT = ["storefront-orders"] as const;
const COURIERS = ["storefront-couriers"] as const;
const keys = {
  list: (params: unknown) => [...ROOT, "list", params] as const,
  detail: (id: string) => [...ROOT, "detail", id] as const,
};

export const useStorefrontOrders = (params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: keys.list(params),
    queryFn: () => storefrontOrdersApi.list(params),
    select: (r) => r.data,
    placeholderData: (prev) => prev,
  });

export const useStorefrontOrder = (id: string) =>
  useQuery({
    queryKey: keys.detail(id),
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

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ROOT });

export const useConfirmOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.confirm(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order confirmed");
      invalidateAll(qc);
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
      invalidateAll(qc);
    },
    onError: handleMutationError,
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; reject?: boolean }) =>
      storefrontOrdersApi.cancel(v.id, v.reject),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order cancelled");
      invalidateAll(qc);
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
      invalidateAll(qc);
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
      invalidateAll(qc);
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
      invalidateAll(qc);
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
      invalidateAll(qc);
    },
    onError: handleMutationError,
  });
};

// --- Courier config ---
export const useCouriers = () =>
  useQuery({
    queryKey: COURIERS,
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
      qc.invalidateQueries({ queryKey: COURIERS });
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
      qc.invalidateQueries({ queryKey: COURIERS });
    },
    onError: handleMutationError,
  });
};
