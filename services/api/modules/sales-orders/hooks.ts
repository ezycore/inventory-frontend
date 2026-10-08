import { salesApi } from "@/services/api";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import {
  AddPaymentDto,
  CreateSalesOrderDto,
  FinalizeSaleDto,
  SaleFilters,
  UpdateSaleDraftDto,
} from "@/types";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handling";

// ============================================
// Sales History Hooks (for Sale model)
// ============================================

/**
 * Get sales list with pagination and filters
 */
export const useSales = (filters?: SaleFilters) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.list(filters),
    queryFn: () => salesApi.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get a single sale by ID with payments
 */
export const useSale = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.detail(id),
    queryFn: () => salesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Several sales by id, sharing `useSale`'s cache entries — for printing a
 * selection of online orders with their linked Sales.
 */
export const useSalesByIds = (ids: readonly string[]) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.salesOrders.detail(id),
      queryFn: () => salesApi.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

/**
 * Get sales summary statistics (for sales history page)
 */
export const useSalesSummary = () => {
  return useQuery({
    queryKey: queryKeys.salesOrders.summary(),
    queryFn: () => salesApi.getSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get payments for a specific sale
 */
export const useSalePayments = (saleId: string) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.payments(saleId),
    queryFn: () => salesApi.getPayments(saleId),
    enabled: !!saleId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get merged transactions timeline for a sale:
 * payments + cash refunds + self return credits + cross-invoice inbound credits.
 */
export const useSaleTransactions = (saleId: string) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.transactions(saleId),
    queryFn: () => salesApi.getTransactions(saleId),
    enabled: !!saleId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Add payment to a sale
 */
export const useAddSalePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      saleId,
      ...data
    }: AddPaymentDto & { saleId: string }) =>
      salesApi.addPayment(saleId, data),
    onSuccess: (data) => {
      toast.success(data.message || "Payment added successfully");
      invalidate(queryClient, "sale.paid");
    },
    onError: handleMutationError,
  });
};

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesOrderDto) => salesApi.createSalesOrder(data),
    onSuccess: (data) => {
      toast.success(data.message || "Sales order created successfully");
      invalidate(queryClient, "sale.posted");
    },
    onError: handleMutationError,
  });
};

// ============================================
// Draft sale lifecycle (update / finalize / delete)
// ============================================

/**
 * Update a draft sale (only works while status === "draft").
 * Does NOT touch inventory / payments / customer dues.
 */
export const useUpdateDraftSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSaleDraftDto & { id: string }) =>
      salesApi.updateDraftSale(id, data),
    onSuccess: (data) => {
      toast.success(data.message || "Draft updated");
      invalidate(queryClient, "sale.drafted");
    },
    onError: handleMutationError,
  });
};

/**
 * Finalize a draft sale: runs the full sale pipeline (inventory deduct,
 * payment, credit, customer due) and transitions status away from "draft".
 */
export const useFinalizeDraftSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: FinalizeSaleDto & { id: string }) =>
      salesApi.finalizeDraftSale(id, data),
    onSuccess: (data) => {
      toast.success(data.message || "Sale finalized");
      invalidate(queryClient, "sale.posted");
    },
    onError: handleMutationError,
  });
};

/**
 * Email the sale receipt to the customer. No cache invalidation — sending a
 * receipt doesn't change the sale.
 */
export const useEmailSaleReceipt = () => {
  return useMutation({
    mutationFn: ({ saleId, email }: { saleId: string; email?: string }) =>
      salesApi.emailReceipt(saleId, email ? { email } : {}),
    onSuccess: (data) => {
      toast.success(data.message || "Receipt emailed");
    },
    onError: handleMutationError,
  });
};

/**
 * Hard-delete a draft sale.
 */
export const useDeleteDraftSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesApi.deleteDraftSale(id),
    onSuccess: (data) => {
      toast.success(data.message || "Draft deleted");
      invalidate(queryClient, "sale.drafted");
    },
    onError: handleMutationError,
  });
};
