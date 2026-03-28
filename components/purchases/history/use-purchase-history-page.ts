"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  useAccounts,
  useAddPurchasePayment,
  usePurchaseOrderPayments,
  usePurchaseOrders,
  usePurchaseOrdersSummary,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useCurrency } from "@/lib/currency";
import type {
  AddPurchasePaymentDto,
  PurchaseOrder,
  PurchaseOrderFilters,
} from "@/types";
import type { Payment } from "./types";

import { getPurchaseHistoryColumns, getPurchaseHistoryActions } from "./columns";
import { buildHistoryFilterConfig } from "./filters";

export function usePurchaseHistoryPage() {
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const { format: formatCurrency } = useCurrency();

  // Table state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  // Modal / drawer state
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [paymentsDrawerOpen, setPaymentsDrawerOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  // API queries
  const { data: purchaseData, isLoading, refetch } = usePurchaseOrders({
    page,
    limit,
    ...filters,
  });
  const { data: paymentsData, isLoading: isLoadingPayments } =
    usePurchaseOrderPayments(selectedOrder?._id || "");
  const { data: accountsData } = useAccounts();
  const addPaymentMutation = useAddPurchasePayment();
  const { data: summaryData, isLoading: isSummaryLoading } =
    usePurchaseOrdersSummary();

  // Derived data
  const summary = summaryData?.data;
  const purchases: PurchaseOrder[] = purchaseData?.data?.items || [];
  const payments: Payment[] = (paymentsData?.data || []) as Payment[];
  const accounts = accountsData?.items || [];

  const paginationInfo = useMemo(() => {
    if (!purchaseData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = purchaseData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [purchaseData]);

  // Handlers
  const handleViewPayments = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setPaymentsDrawerOpen(true);
  }, []);

  const handleViewDetails = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDetailDrawerOpen(true);
  }, []);

  const handleMakePayment = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setPaymentAmount((order.dueAmount || 0).toFixed(2));
    setPaymentAccountId("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setPaymentModalOpen(true);
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedOrder || !paymentAccountId) {
      toast.error("Please select a payment account");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > (selectedOrder.dueAmount || 0)) {
      toast.error("Payment amount cannot exceed due amount");
      return;
    }

    try {
      await addPaymentMutation.mutateAsync({
        id: selectedOrder._id,
        data: {
          amount,
          accountId: paymentAccountId,
          paymentMethod:
            paymentMethod as AddPurchasePaymentDto["paymentMethod"],
          notes: paymentNotes || undefined,
        },
      });
      setPaymentModalOpen(false);
      refetch();
    } catch {
      // Error handled by mutation's onError
    }
  }, [
    selectedOrder,
    paymentAmount,
    paymentAccountId,
    paymentMethod,
    paymentNotes,
    addPaymentMutation,
    refetch,
  ]);

  const formatDateTime = (date: string | Date) =>
    format(new Date(date), "dd MMM yyyy HH:mm");

  // Columns, actions, filters — memoised
  const columns = useMemo(
    () => getPurchaseHistoryColumns({ formatCurrency }),
    [formatCurrency],
  );

  const customActions = useMemo(
    () =>
      getPurchaseHistoryActions({
        onViewDetails: handleViewDetails,
        onViewPayments: handleViewPayments,
        onMakePayment: handleMakePayment,
        isAccountsEnabled,
      }),
    [handleViewDetails, handleViewPayments, handleMakePayment, isAccountsEnabled],
  );

  const filterConfig = useMemo(
    () =>
      buildHistoryFilterConfig({
        onApply: (newFilters) => {
          setFilters(newFilters);
          setPage(1);
        },
        onReset: () => {
          setFilters({});
          setPage(1);
        },
      }),
    [],
  );

  return {
    // Data
    purchases,
    payments,
    accounts,
    summary,
    selectedOrder,
    paginationInfo,

    // Loading states
    isLoading,
    isLoadingPayments,
    isSummaryLoading,

    // Table config
    columns,
    customActions,
    filterConfig,

    // Pagination
    page,
    limit,
    setPage,
    setLimit,

    // Drawers / dialogs
    detailDrawerOpen,
    setDetailDrawerOpen,
    paymentsDrawerOpen,
    setPaymentsDrawerOpen,
    paymentModalOpen,
    setPaymentModalOpen,

    // Payment form
    paymentAmount,
    setPaymentAmount,
    paymentAccountId,
    setPaymentAccountId,
    paymentMethod,
    setPaymentMethod,
    paymentNotes,
    setPaymentNotes,
    addPaymentMutation,
    handlePaymentSubmit,
    handleMakePayment,

    // Features
    isAccountsEnabled,
    formatCurrency,
    formatDateTime,
  };
}
