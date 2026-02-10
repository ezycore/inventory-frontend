import { salesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import {
  AddPaymentDto,
  CreateSalesOrderDto,
  SaleFilters,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
 * Get payments for a specific sale
 */
export const useSalePayments = (saleId: string) => {
  return useQuery({
    queryKey: [...queryKeys.salesOrders.detail(saleId), "payments"],
    queryFn: () => salesApi.getPayments(saleId),
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
    onSuccess: (data, variables) => {
      toast.success(data.message || "Payment added successfully");
      // Invalidate sales list to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
      // Invalidate specific sale detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.salesOrders.detail(variables.saleId),
      });
      // Invalidate payments list for this sale
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.salesOrders.detail(variables.saleId), "payments"],
      });
      // Also invalidate accounts since balance changed
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
    },
    onError: handleMutationError,
  });
};
