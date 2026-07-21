import { purchaseOrdersApi, purchaseReturnsApi } from "@/services/api";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import type {
  AddPurchasePaymentDto,
  CreatePurchaseOrderDto,
  CreatePurchaseOrdersDto,
  CreatePurchaseReturnDto,
  FinalizePurchaseOrderDto,
  PurchaseOrderFilters,
  PurchaseReturnFilters,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderDraftDto,
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

/**
 * Get merged transactions timeline for a purchase order:
 * payments + cash refunds + self return credits + cross-PO inbound credits.
 */
export const usePurchaseOrderTransactions = (purchaseOrderId: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.transactions(purchaseOrderId),
    queryFn: () => purchaseOrdersApi.getTransactions(purchaseOrderId),
    enabled: !!purchaseOrderId,
    staleTime: 2 * 60 * 1000,
  });
};

// Create purchase order
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrdersDto) => purchaseOrdersApi.create(data),
    onSuccess: (data) => {
      toast.success(data.message || "Purchase order created successfully");
      invalidate(queryClient, "purchase.ordered");
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
    onSuccess: (data) => {
      toast.success(data.message || "Purchase order updated successfully");
      invalidate(queryClient, "purchase.ordered");
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
    onSuccess: (data) => {
      toast.success(data.message || "Items received successfully");
      invalidate(queryClient, "purchase.received");
    },
    onError: handleMutationError,
  });
};

// Cancel purchase order
export const useCancelPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: (data) => {
      toast.success(data.message || "Purchase order cancelled successfully");
      invalidate(queryClient, "purchase.ordered");
    },
    onError: handleMutationError,
  });
};

// Hard-delete a draft purchase order (status must be "draft")
export const useDeleteDraftPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.deleteDraft(id),
    onSuccess: (data) => {
      toast.success(data.message || "Draft purchase order deleted");
      invalidate(queryClient, "purchase.ordered");
    },
    onError: handleMutationError,
  });
};

// Update a draft purchase order (no side effects)
export const useUpdateDraftPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePurchaseOrderDraftDto;
    }) => purchaseOrdersApi.updateDraft(id, data),
    onSuccess: (data) => {
      toast.success(data.message || "Draft purchase order updated");
      invalidate(queryClient, "purchase.ordered");
    },
    onError: handleMutationError,
  });
};

// Finalize a draft purchase order (runs full pipeline)
export const useFinalizeDraftPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FinalizePurchaseOrderDto;
    }) => purchaseOrdersApi.finalizeDraft(id, data),
    onSuccess: (data) => {
      toast.success(data.message || "Purchase order finalized");
      invalidate(queryClient, "purchase.received");
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
    onSuccess: (data) => {
      toast.success(data.message || "Payment added successfully");
      invalidate(queryClient, "purchase.paid");
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
    onSuccess: () => {
      toast.success("Purchase return created successfully");
      // `byPurchaseOrder` and the PO detail both sit under their resource roots,
      // so the event reaches them.
      invalidate(queryClient, "purchase.returned");
    },
    onError: handleMutationError,
  });
};
