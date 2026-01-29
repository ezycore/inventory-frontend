import { purchaseOrdersApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  CreatePurchaseOrderDto,
  PurchaseOrder,
  PurchaseOrderStatus,
  ReceivePurchaseOrderDto,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handling";
import { PurchaseOrderFilters } from "@/lib/api/purchase-orders";

// List purchase orders
export const usePurchaseOrders = (filters?: PurchaseOrderFilters) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.list(filters),
    queryFn: () => purchaseOrdersApi.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// Get single purchase order
export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.detail(id),
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Create purchase order
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderDto) => purchaseOrdersApi.create(data),
    onSuccess: (data) => {
      toast.success(data.message || "Purchase order created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
    },
    onError: handleMutationError,
  });
};

// Update purchase order
export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Partial<CreatePurchaseOrderDto>) =>
      purchaseOrdersApi.update(id, data),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Purchase order updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(variables.id),
      });
    },
    onError: handleMutationError,
  });
};

// Update purchase order status
export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      purchaseOrdersApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Status updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(variables.id),
      });
    },
    onError: handleMutationError,
  });
};

// Receive items from purchase order
export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceivePurchaseOrderDto }) =>
      purchaseOrdersApi.receive(id, data),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Items received successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(variables.id),
      });
      // Also invalidate inventory since stock levels changed
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
    },
    onError: handleMutationError,
  });
};

// Cancel purchase order
export const useCancelPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: (data, id) => {
      toast.success(data.message || "Purchase order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(id),
      });
    },
    onError: handleMutationError,
  });
};

// Delete purchase order
export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.delete(id),
    onSuccess: (data) => {
      toast.success(data.message || "Purchase order deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
    },
    onError: handleMutationError,
  });
};

// Aliases for consistency with other modules
export const useAddPurchaseOrder = useCreatePurchaseOrder;
