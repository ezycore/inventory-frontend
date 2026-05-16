"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  useAccounts,
  useAddPurchasePayment,
  usePurchaseOrderPayments,
  usePurchaseOrderReturns,
  usePurchaseOrders,
  usePurchaseOrdersSummary,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useCurrency } from "@/lib/currency";
import type {
  AddPurchasePaymentDto,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseReturn,
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

  // Drawer state (single drawer with summary | payment mode)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"summary" | "payment">(
    "summary",
  );
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  // API queries
  const {
    data: purchaseData,
    isLoading,
    refetch,
  } = usePurchaseOrders({ page, limit, ...filters });
  const { data: paymentsData, isLoading: isLoadingPayments } =
    usePurchaseOrderPayments(selectedOrder?._id || "");
  const { data: returnsData, isLoading: isLoadingReturns } =
    usePurchaseOrderReturns(selectedOrder?._id || "");
  const { data: accountsData } = useAccounts();
  const addPaymentMutation = useAddPurchasePayment();
  const { data: summaryData, isLoading: isSummaryLoading } =
    usePurchaseOrdersSummary();

  // Derived data
  const summary = summaryData?.data;
  const purchases: PurchaseOrder[] = purchaseData?.data?.items || [];
  const payments: Payment[] = (paymentsData?.data || []) as Payment[];
  const purchaseReturns: PurchaseReturn[] =
    ((returnsData as { data?: PurchaseReturn[] | { returns?: PurchaseReturn[] } } | undefined)
      ?.data as PurchaseReturn[] | undefined) instanceof Array
      ? ((returnsData as { data: PurchaseReturn[] }).data)
      : (((returnsData as { data?: { returns?: PurchaseReturn[] } } | undefined)
          ?.data?.returns as PurchaseReturn[]) || []);
  const accounts = accountsData?.items || [];

  const paginationInfo = useMemo(() => {
    if (!purchaseData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = purchaseData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [purchaseData]);

  // Handlers
  const handleViewSummary = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDrawerMode("summary");
    setDrawerOpen(true);
  }, []);

  const handleMakePayment = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDrawerMode("payment");
    setPaymentAmount((order.dueAmount || 0).toFixed(2));
    setPaymentAccountId("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setDrawerOpen(true);
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
      const response = await addPaymentMutation.mutateAsync({
        id: selectedOrder._id,
        data: {
          amount,
          accountId: paymentAccountId,
          paymentMethod:
            paymentMethod as AddPurchasePaymentDto["paymentMethod"],
          notes: paymentNotes || undefined,
        },
      });
      const updated = (
        response as { data?: { order?: PurchaseOrder } } | undefined
      )?.data?.order;
      if (updated) {
        setSelectedOrder(updated);
      }
      setDrawerMode("summary");
      setPaymentAmount("");
      refetch();
    } catch {
      // mutation onError handles toast
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
        onViewSummary: handleViewSummary,
        onMakePayment: handleMakePayment,
        isAccountsEnabled,
      }),
    [handleViewSummary, handleMakePayment, isAccountsEnabled],
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
    purchaseReturns,
    accounts,
    summary,
    selectedOrder,
    paginationInfo,

    // Loading states
    isLoading,
    isLoadingPayments,
    isLoadingReturns,
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

    // Drawer (single)
    drawerOpen,
    setDrawerOpen,
    drawerMode,
    setDrawerMode,
    drawerRef,

    // Payment form
    paymentAmount,
    setPaymentAmount,
    paymentAccountId,
    setPaymentAccountId,
    paymentMethod,
    setPaymentMethod,
    paymentNotes,
    setPaymentNotes,
    isSubmittingPayment: addPaymentMutation.isPending,
    handlePaymentSubmit,
    handleMakePayment,
    handleViewSummary,

    // Features
    isAccountsEnabled,
    formatCurrency,
    formatDateTime,
  };
}
