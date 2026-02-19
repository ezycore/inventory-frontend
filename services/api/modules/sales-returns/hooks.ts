/**
 * Sales Returns Hooks Module
 * React Query hooks for sales return operations
 */

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
    queryKey: [...queryKeys.salesReturns.all(), "summary"],
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
    onSuccess: (response: unknown) => {
      const result = (response as any)?.data;
      toast.success("Sales return created successfully");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.salesReturns.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      if (result?.saleId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.salesReturns.bySale(result.saleId) 
        });
      }
    },
    onError: (error: unknown) => {
      const message = (error as any)?.response?.data?.error || "Failed to create sales return";
      toast.error(message);
    },
  });
};
