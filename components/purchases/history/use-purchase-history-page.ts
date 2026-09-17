"use client";
// coding-standard: maintained

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { formatInTimeZone } from "date-fns-tz";
import { getOrgTimezone } from "@/hooks/use-org-calendar";

import {
  useAccountPaymentOptions,
  useAddPurchasePayment,
  useDeleteDraftPurchaseOrder,
  usePurchaseOrderPayments,
  usePurchaseOrderReturns,
  usePurchaseOrderTransactions,
  usePurchaseOrders,
  usePurchaseOrdersSummary,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useCurrency } from "@/lib/currency";
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseReturn,
} from "@/types";
import type { Payment } from "./types";

import { getPurchaseHistoryColumns, getPurchaseHistoryActions } from "./columns";
import { buildHistoryFilterConfig } from "./filters";
import { ALL_ORDER_STATUSES } from "../orders/filters";

export function usePurchaseHistoryPage() {
  const router = useRouter();
  const t = useTranslations("purchases");
  const tActions = useTranslations("common.actions");
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
  const [paymentNotes, setPaymentNotes] = useState("");
  const [useSupplierCredit, setUseSupplierCredit] = useState(false);

  // "all" is a UI-only sentinel for "no status filter" — drop it before querying.
  const apiFilters = useMemo(() => {
    if ((filters.status as string) === ALL_ORDER_STATUSES) {
      const { status: _status, ...rest } = filters;
      return rest;
    }
    return filters;
  }, [filters]);

  // API queries
  const {
    data: purchaseData,
    isLoading,
    refetch,
  } = usePurchaseOrders({ page, limit, ...apiFilters });
  const { data: paymentsData, isLoading: isLoadingPayments } =
    usePurchaseOrderPayments(selectedOrder?._id || "");
  const { data: returnsData, isLoading: isLoadingReturns } =
    usePurchaseOrderReturns(selectedOrder?._id || "");
  const { data: transactionsData, isLoading: isLoadingTransactions } =
    usePurchaseOrderTransactions(selectedOrder?._id || "");
  // Minimal list — reachable by purchases.edit (what recording a payment
  // actually requires) as well as accounts.view.
  const { data: accountsData } = useAccountPaymentOptions(isAccountsEnabled);
  const addPaymentMutation = useAddPurchasePayment();
  const deleteDraftMutation = useDeleteDraftPurchaseOrder();
  const { confirm, ConfirmDialog: DeleteDraftConfirmDialog } = useConfirm();
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
  const accounts = accountsData || [];

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
    setPaymentNotes("");
    setUseSupplierCredit(false);
    setDrawerOpen(true);
  }, []);

  const handleDeleteDraft = useCallback(async (order: PurchaseOrder) => {
    const ok = await confirm({
      title: t("history.deleteDraftTitle"),
      description: t("history.deleteDraftDescription", { number: order.orderNumber }),
      confirmLabel: tActions("delete"),
      cancelLabel: tActions("cancel"),
      confirmClassName: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    });
    if (!ok) return;
    try {
      await deleteDraftMutation.mutateAsync(order._id);
    } catch {
      // toast handled by mutation
    }
  }, [confirm, deleteDraftMutation, t, tActions]);

  const handleEditDraft = useCallback(
    (order: PurchaseOrder) => {
      router.push(`/purchases?draftId=${order._id}`);
    },
    [router],
  );

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedOrder) return;
    if (!useSupplierCredit && !paymentAccountId) {
      toast.error(t("history.selectPaymentAccount"));
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(t("history.enterValidAmount"));
      return;
    }

    if (amount > (selectedOrder.dueAmount || 0)) {
      toast.error(t("history.exceedsDue"));
      return;
    }

    try {
      const response = await addPaymentMutation.mutateAsync({
        id: selectedOrder._id,
        data: {
          amount,
          accountId: useSupplierCredit ? undefined : paymentAccountId,
          notes: paymentNotes || undefined,
          useSupplierCredit: useSupplierCredit || undefined,
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
      setUseSupplierCredit(false);
      refetch();
    } catch {
      // mutation onError handles toast
    }
  }, [
    selectedOrder,
    paymentAmount,
    paymentAccountId,
    paymentNotes,
    useSupplierCredit,
    addPaymentMutation,
    refetch,
    t,
  ]);

  const formatDateTime = (date: string | Date) =>
    formatInTimeZone(new Date(date), getOrgTimezone(), "dd MMM yyyy hh:mm aa");

  // Columns, actions, filters — memoised
  const columns = useMemo(
    () => getPurchaseHistoryColumns({ formatCurrency, t }),
    [formatCurrency, t],
  );

  const customActions = useMemo(
    () =>
      getPurchaseHistoryActions({
        onViewSummary: handleViewSummary,
        onMakePayment: handleMakePayment,
        isAccountsEnabled,
        onEditDraft: handleEditDraft,
        onDeleteDraft: handleDeleteDraft,
        t,
      }),
    [
      handleViewSummary,
      handleMakePayment,
      isAccountsEnabled,
      handleEditDraft,
      handleDeleteDraft,
      t,
    ],
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
        t,
      }),
    [t],
  );

  return {
    // Data
    purchases,
    payments,
    purchaseReturns,
    transactions: transactionsData?.data,
    accounts,
    summary,
    selectedOrder,
    paginationInfo,

    // Loading states
    isLoading,
    isLoadingPayments,
    isLoadingReturns,
    isLoadingTransactions,
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
    paymentNotes,
    setPaymentNotes,
    useSupplierCredit,
    setUseSupplierCredit,
    isSubmittingPayment: addPaymentMutation.isPending,
    handlePaymentSubmit,
    handleMakePayment,
    handleViewSummary,

    // Features
    isAccountsEnabled,
    formatCurrency,
    formatDateTime,

    // Dialogs
    DeleteDraftConfirmDialog,
  };
}
