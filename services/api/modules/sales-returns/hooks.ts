/**
 * Sales Returns Hooks Module
 * React Query hooks for sales return operations
 */

import { invalidate } from "@/services/api/invalidation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../../query-keys";
import { salesReturnsApi, type CreateSalesReturnDto, type SalesReturnFilters } from "./api";

/**
 * Hook to fetch all sales returns with optional filters
 */
export const useSalesReturns = (filters?: SalesReturnFilters) => {
  return useQuery({
    queryKey: queryKeys.salesReturns.list(filters),
    queryFn: () => salesReturnsApi.getAll(filters),
  });
};

/**
 * Hook to fetch a single sales return by ID
 */
export const useSalesReturn = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salesReturns.detail(id),
    queryFn: () => salesReturnsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch returns for a specific sale
 */
export const useSaleReturns = (saleId: string) => {
  return useQuery({
    queryKey: queryKeys.salesReturns.bySale(saleId),
    queryFn: () => salesReturnsApi.getBySaleId(saleId),
    enabled: !!saleId,
  });
};

/**
 * Hook to fetch customer pending dues for refund allocation
 */
export const useCustomerPendingDues = (customerId: string, excludeSaleId?: string) => {
  return useQuery({
    queryKey: queryKeys.salesReturns.customerDues(customerId, excludeSaleId),
    queryFn: () => salesReturnsApi.getCustomerPendingDues(customerId, excludeSaleId),
    enabled: !!customerId,
  });
};

/**
 * Hook to fetch sales returns summary statistics
 */
export const useSalesReturnsSummary = () => {
  return useQuery({
    queryKey: queryKeys.salesReturns.summary(),
    queryFn: () => salesReturnsApi.getSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a new sales return
 */
export const useCreateSalesReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesReturnDto) => salesReturnsApi.create(data),
    onSuccess: () => {
      toast.success("Sales return created successfully");
      // `bySale` sits under the sales-returns root, so the event covers it.
      invalidate(queryClient, "sale.returned");
    },
    onError: (error: unknown) => {
      const message = (error as any)?.response?.data?.error || "Failed to create sales return";
      toast.error(message);
    },
  });
};
