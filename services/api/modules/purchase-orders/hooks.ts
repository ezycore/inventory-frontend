import { purchaseOrdersApi, purchaseReturnsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import type {
  AddPurchasePaymentDto,
  CreatePurchaseOrderDto,
  CreatePurchaseReturnDto,
  PurchaseOrderFilters,
  PurchaseReturnFilters,
  ReceivePurchaseOrderDto,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handling";

// ============================
// Purchase Orders Hooks
// ============================

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

// Get purchase orders summary
export const usePurchaseOrdersSummary = () => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.summary(),
    queryFn: () => purchaseOrdersApi.getSummary(),
    staleTime: 2 * 60 * 1000,
  });
};

// Get purchase order payments
export const usePurchaseOrderPayments = (id: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.payments(id),
    queryFn: () => purchaseOrdersApi.getPayments(id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
    },
    onError: handleMutationError,
  });
};

// Add payment to purchase order
export const useAddPurchasePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddPurchasePaymentDto }) =>
      purchaseOrdersApi.addPayment(id, data),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Payment added successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.payments(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
    },
    onError: handleMutationError,
  });
};

// Aliases for consistency with other modules
export const useAddPurchaseOrder = useCreatePurchaseOrder;

// ============================
// Purchase Returns Hooks
// ============================

// List purchase returns
export const usePurchaseReturns = (filters?: PurchaseReturnFilters) => {
  return useQuery({
    queryKey: queryKeys.purchaseReturns.list(filters),
    queryFn: () => purchaseReturnsApi.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// Get single purchase return
export const usePurchaseReturn = (id: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseReturns.detail(id),
    queryFn: () => purchaseReturnsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Get returns for a specific purchase order
export const usePurchaseOrderReturns = (purchaseOrderId: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseReturns.byPurchaseOrder(purchaseOrderId),
    queryFn: () => purchaseReturnsApi.getByPurchaseOrderId(purchaseOrderId),
    enabled: !!purchaseOrderId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get supplier pending dues for refund allocation
export const useSupplierPendingDues = (supplierId: string, excludePurchaseOrderId?: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseReturns.supplierDues(supplierId, excludePurchaseOrderId),
    queryFn: () => purchaseReturnsApi.getSupplierPendingDues(supplierId, excludePurchaseOrderId),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get purchase returns summary
export const usePurchaseReturnsSummary = () => {
  return useQuery({
    queryKey: queryKeys.purchaseReturns.summary(),
    queryFn: () => purchaseReturnsApi.getSummary(),
    staleTime: 2 * 60 * 1000,
  });
};

// Create purchase return
export const useCreatePurchaseReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseReturnDto) => purchaseReturnsApi.create(data),
    onSuccess: (response) => {
      const result = (response as any)?.data;
      toast.success("Purchase return created successfully");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReturns.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      if (result?.purchaseOrderId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.purchaseReturns.byPurchaseOrder(result.purchaseOrderId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.purchaseOrders.detail(result.purchaseOrderId),
        });
      }
    },
    onError: handleMutationError,
  });
};
