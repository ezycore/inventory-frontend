import { salesOrdersApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  CreateSalesOrderDto,
  FulfillSalesOrderDto,
  SalesOrder,
  SalesOrderStatus,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handling";
import { SalesOrderFilters } from "@/lib/api/sales-orders";

// List sales orders
export const useSalesOrders = (filters?: SalesOrderFilters) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.list(filters),
    queryFn: () => salesOrdersApi.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// Get single sales order
export const useSalesOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.detail(id),
    queryFn: () => salesOrdersApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Create sales order
export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesOrderDto) => salesOrdersApi.create(data),
    onSuccess: (data) => {
      toast.success(data.message || "Sales order created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
    },
    onError: handleMutationError,
  });
};

// Update sales order
export const useUpdateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Partial<CreateSalesOrderDto>) =>
      salesOrdersApi.update(id, data),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Sales order updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.salesOrders.detail(variables.id),
      });
    },
    onError: handleMutationError,
  });
};

// Update sales order status
export const useUpdateSalesOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SalesOrderStatus }) =>
      salesOrdersApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Status updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.salesOrders.detail(variables.id),
      });
    },
    onError: handleMutationError,
  });
};

// Fulfill sales order
export const useFulfillSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: FulfillSalesOrderDto }) =>
      salesOrdersApi.fulfill(id, data),
    onSuccess: (data, variables) => {
      toast.success(data.message || "Order fulfilled successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.salesOrders.detail(variables.id),
      });
      // Also invalidate inventory since stock levels changed
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
    },
    onError: handleMutationError,
  });
};

// Cancel sales order
export const useCancelSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.cancel(id),
    onSuccess: (data, id) => {
      toast.success(data.message || "Sales order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.salesOrders.detail(id),
      });
    },
    onError: handleMutationError,
  });
};

// Delete sales order
export const useDeleteSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.delete(id),
    onSuccess: (data) => {
      toast.success(data.message || "Sales order deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all() });
    },
    onError: handleMutationError,
  });
};

// Get customer's default discount
export const useCustomerDiscount = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customer-discount', customerId],
    queryFn: () => salesOrdersApi.getCustomerDiscount(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
};

// Aliases for consistency with other modules
export const useAddSalesOrder = useCreateSalesOrder;
