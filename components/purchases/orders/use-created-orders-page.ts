"use client";
// coding-standard: maintained

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  ALL_ORDER_STATUSES,
  buildCreatedOrdersFilterConfig,
  defaultCreatedOrderFilters,
  getCreatedOrderActions,
  getCreatedOrdersColumns,
} from ".";

export function useCreatedOrdersPage() {
  const router = useRouter();
  const t = useTranslations("purchases");
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

  // "all" is a UI-only sentinel for "no status filter" — drop it before querying.
  const apiFilters = useMemo(() => {
    if ((filters.status as string) === ALL_ORDER_STATUSES) {
      const { status: _status, ...rest } = filters;
      return rest;
    }
    return filters;
  }, [filters]);

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = usePurchaseOrders({ page, limit, ...apiFilters });

  const { data: orderDetailData, isLoading: isLoadingDetail } = usePurchaseOrder(
    selectedOrderId || "",
  );

  const selectedOrder = orderDetailData?.data ?? null;
  const receiveMutation = useReceivePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const orders: PurchaseOrder[] = ordersData?.data?.items || [];

  const getOrderDisplayTotal = useCallback(
    (order: PurchaseOrder) =>
      order.invoiceAmount || order.totalAmount || order.subtotal || 0,
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

  const columns = useMemo(() => getCreatedOrdersColumns({ formatCurrency, t }), [formatCurrency, t]);

  const customActions = useMemo(
    () =>
      getCreatedOrderActions({
        onViewOrder: handleViewOrder,
        onEditOrder: handleEditOrder,
        t,
      }),
    [handleViewOrder, handleEditOrder, t],
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
        t,
      }),
    [t],
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
