"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useCancelPurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrders,
  useReceivePurchaseOrder,
} from "@/services/api";
import { useCurrency } from "@/lib/currency";
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  ReceivePurchaseOrderDto,
} from "@/types";

import {
  buildCreatedOrdersFilterConfig,
  defaultCreatedOrderFilters,
  getCreatedOrderActions,
  getCreatedOrdersColumns,
} from ".";

export function useCreatedOrdersPage() {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PurchaseOrderFilters>(
    defaultCreatedOrderFilters,
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = usePurchaseOrders({ page, limit, ...filters });

  const { data: orderDetailData, isLoading: isLoadingDetail } = usePurchaseOrder(
    selectedOrderId || "",
  );

  const selectedOrder = orderDetailData?.data ?? null;
  const receiveMutation = useReceivePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const orders: PurchaseOrder[] = ordersData?.data?.items || [];

  const getOrderDisplayTotal = useCallback(
    (order: PurchaseOrder) =>
      order.invoiceAmount || order.grandTotal || order.totalAmount || order.subtotal || 0,
    [],
  );

  const paginationInfo = useMemo(() => {
    if (!ordersData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = ordersData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [ordersData]);

  const handleViewOrder = useCallback((order: PurchaseOrder) => {
    setSelectedOrderId(order._id);
    setViewDrawerOpen(true);
  }, []);

  const handleEditOrder = useCallback(
    (order: PurchaseOrder) => {
      router.push(`/purchases/orders/${order._id}/edit`);
    },
    [router],
  );

  const handleReceiveSubmit = useCallback(
    async (id: string, data: ReceivePurchaseOrderDto) => {
      try {
        await receiveMutation.mutateAsync({ id, data });
        setReceiveDialogOpen(false);
        setSelectedOrderId(null);
        refetch();
      } catch {
        // toast handled by mutation
      }
    },
    [receiveMutation, refetch],
  );

  const handleCancelSubmit = useCallback(async () => {
    if (!selectedOrderId) return;
    try {
      await cancelMutation.mutateAsync(selectedOrderId);
      setCancelDialogOpen(false);
      setSelectedOrderId(null);
      refetch();
    } catch {
      // toast handled by mutation
    }
  }, [selectedOrderId, cancelMutation, refetch]);

  const columns = useMemo(() => getCreatedOrdersColumns({ formatCurrency }), [formatCurrency]);

  const customActions = useMemo(
    () =>
      getCreatedOrderActions({
        onViewOrder: handleViewOrder,
        onEditOrder: handleEditOrder,
      }),
    [handleViewOrder, handleEditOrder],
  );

  const filterConfig = useMemo(
    () =>
      buildCreatedOrdersFilterConfig({
        onApply: (newFilters) => {
          setFilters(newFilters);
          setPage(1);
        },
        onReset: () => {
          setFilters(defaultCreatedOrderFilters);
          setPage(1);
        },
      }),
    [],
  );

  return {
    // Data
    orders,
    selectedOrder,

    // Loading
    isLoading,
    isLoadingDetail,

    // Table config
    columns,
    customActions,
    filterConfig,

    // Pagination
    page,
    limit,
    setPage,
    setLimit,
    paginationInfo,

    // Selection / dialogs
    selectedOrderId,
    setSelectedOrderId,
    viewDrawerOpen,
    setViewDrawerOpen,
    receiveDialogOpen,
    setReceiveDialogOpen,
    cancelDialogOpen,
    setCancelDialogOpen,

    // Navigation / actions
    handleViewOrder,
    handleEditOrder,

    // Mutations / handlers
    handleReceiveSubmit,
    handleCancelSubmit,
    isReceiving: receiveMutation.isPending,
    isCancelling: cancelMutation.isPending,
    getOrderDisplayTotal,
    formatCurrency,
  } as const;
}

export type UseCreatedOrdersPage = ReturnType<typeof useCreatedOrdersPage>;
