"use client";
// coding-standard: maintained

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { useCurrency } from "@/lib/currency";
import { roundMoney } from "@/lib/money";
import {
  useAccounts,
  useCreatePurchaseReturn,
  usePurchaseOrder,
  usePurchaseReturns,
  usePurchaseReturnsSummary,
  useSupplierPendingDues,
} from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type {
  Account,
  PurchaseOrder,
  PurchaseReturn,
  PurchaseReturnFilters,
  PurchaseReturnReason,
} from "@/types";
import type { FilterField } from "@/types/filter";

import type { ReturnableItem, DueAllocation } from "./types";
import {
  buildReturnableItems,
  buildDueAllocations,
  extractSupplierId,
  calculateItemRefund,
  calculateMaxRefund,
} from "./helpers";
import { getReturnsColumns } from "./columns";

// =====================
// Schema
// =====================

const makeOrderSearchSchema = (message: string) =>
  z.object({
    orderId: z.string().min(1, message),
  });

type OrderSearchData = { orderId: string };

// =====================
// Hook
// =====================

export function usePurchaseReturnsPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("purchases");
  const tReturns = useTranslations("purchases.returns");
  const { format: formatCurrency } = useCurrency();

  // ── State ─────────────────────────────────────────────────────
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    searchParams.get("orderId"),
  );
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
  const [reason, setReason] = useState<PurchaseReturnReason>("damaged");
  const [notes, setNotes] = useState("");
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [dueAllocations, setDueAllocations] = useState<DueAllocation[]>([]);
  const [accountRefundAmount, setAccountRefundAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [supplierCreditAmount, setSupplierCreditAmount] = useState(0);

  // ── Details sheet ─────────────────────────────────────────────
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(
    null,
  );

  // ── Pagination + filters ──────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PurchaseReturnFilters>({});

  const handleViewDetails = useCallback((ret: PurchaseReturn) => {
    setSelectedReturn(ret);
    setDetailsSheetOpen(true);
  }, []);

  // ── Auth & Features ───────────────────────────────────────────
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // ── API Hooks ─────────────────────────────────────────────────
  const { data: orderData, isLoading: isLoadingOrder } = usePurchaseOrder(
    selectedOrderId || "",
  );
  const { data: returnsData, isLoading: isLoadingReturns } = usePurchaseReturns(
    { page, limit, ...filters },
  );
  const { data: accountsData } = useAccounts(
    isAccountsEnabled ? { status: "active", limit: 100 } : undefined,
  );
  const { data: summaryData, isLoading: isSummaryLoading } =
    usePurchaseReturnsSummary();

  // ── Derived ───────────────────────────────────────────────────
  const order = orderData?.data as PurchaseOrder | undefined;
  const returnsResponse = returnsData?.data as
    | {
        items?: PurchaseReturn[];
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
      }
    | undefined;
  const returns: PurchaseReturn[] = returnsResponse?.items ?? [];
  const accounts = ((accountsData as { items?: Account[] } | undefined)?.items ??
    []) as Account[];
  const summary = summaryData?.data;

  const paginationInfo = useMemo(() => {
    if (!returnsResponse) return null;
    return {
      total: returnsResponse.total ?? 0,
      totalPages: returnsResponse.totalPages ?? 1,
      hasNext: returnsResponse.hasNext ?? false,
      hasPrev: returnsResponse.hasPrev ?? false,
    };
  }, [returnsResponse]);

  // ── Supplier pending dues ─────────────────────────────────────
  const orderSupplierId = useMemo(() => extractSupplierId(order), [order]);
  const { data: pendingDuesData } = useSupplierPendingDues(
    orderSupplierId,
    selectedOrderId || "",
  );
  const pendingDues = useMemo(
    () => {
      const inner = (pendingDuesData as { data?: { dues?: unknown } } | undefined)?.data;
      return ((inner?.dues as Array<Record<string, unknown>>) || []);
    },
    [pendingDuesData],
  );

  const createReturnMutation = useCreatePurchaseReturn();

  // ── Form ──────────────────────────────────────────────────────
  const orderSearchSchema = useMemo(
    () => makeOrderSearchSchema(t("returns.searchValidation")),
    [t],
  );
  const searchForm = useForm<OrderSearchData>({
    resolver: zodResolver(orderSearchSchema),
    defaultValues: { orderId: "" },
  });

  // ── Init helpers ──────────────────────────────────────────────
  const initFromOrder = useCallback((o: PurchaseOrder | undefined) => {
    if (o) setReturnableItems(buildReturnableItems(o));
  }, []);

  const initFromPendingDues = useCallback(
    (dues: Array<Record<string, unknown>>) => {
      if (dues.length) setDueAllocations(buildDueAllocations(dues));
    },
    [],
  );

  // Auto-sync (legacy support)
  useEffect(() => {
    if (order) setReturnableItems(buildReturnableItems(order));
  }, [order]);
  useEffect(() => {
    setDueAllocations(buildDueAllocations(pendingDues));
  }, [pendingDues]);

  // ── Computed totals ───────────────────────────────────────────
  const totalReturnQty = useMemo(
    () =>
      returnableItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.returnQty, 0),
    [returnableItems],
  );
  const grossRefundAmount = useMemo(
    () =>
      roundMoney(
        returnableItems
          .filter((i) => i.selected)
          .reduce((sum, i) => sum + i.refundAmount, 0),
      ),
    [returnableItems],
  );
  const totalRefundAmount = useMemo(
    () => roundMoney(Math.max(0, grossRefundAmount - deductionAmount)),
    [grossRefundAmount, deductionAmount],
  );
  const orderDueAmount = order?.dueAmount || 0;
  const adjustOrderDueAmount = useMemo(
    () => roundMoney(Math.min(totalRefundAmount, orderDueAmount)),
    [totalRefundAmount, orderDueAmount],
  );
  const totalOtherDuesAllocated = useMemo(
    () =>
      roundMoney(
        dueAllocations
          .filter((d) => d.selected)
          .reduce((sum, d) => sum + d.allocatedAmount, 0),
      ),
    [dueAllocations],
  );
  const remainingForRefund = useMemo(() => {
    const afterOrderDue = totalRefundAmount - adjustOrderDueAmount;
    return roundMoney(Math.max(0, afterOrderDue - totalOtherDuesAllocated - supplierCreditAmount));
  }, [totalRefundAmount, adjustOrderDueAmount, totalOtherDuesAllocated, supplierCreditAmount]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleSearch = useCallback((data: OrderSearchData) => {
    setSelectedOrderId(data.orderId.trim());
  }, []);

  const handleClearSearch = useCallback(() => {
    setSelectedOrderId(null);
    setReturnableItems([]);
    setDueAllocations([]);
    setDeductionAmount(0);
    setAccountRefundAmount(0);
    setSelectedAccountId("");
    setSupplierCreditAmount(0);
    setNotes("");
    setShowNewReturn(false);
    searchForm.reset();
  }, [searchForm]);

  const handleItemSelect = useCallback((index: number, selected: boolean) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected,
        ...(selected ? {} : { returnQty: 0, refundAmount: 0 }),
      };
      return updated;
    });
  }, []);

  const handleItemQtyChange = useCallback((index: number, qty: number) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validQty = Math.max(0, Math.min(qty, item.maxReturnableQty));
      const refund = calculateItemRefund(validQty, item.refundUnitPrice);
      updated[index] = {
        ...item,
        returnQty: validQty,
        refundAmount: refund,
        selected: validQty > 0,
      };
      return updated;
    });
  }, []);

  const handleRefundAmountChange = useCallback(
    (index: number, amount: number) => {
      setReturnableItems((prev) => {
        const updated = [...prev];
        const item = updated[index];
        const maxRefund = calculateMaxRefund(item.returnQty, item.refundUnitPrice);
        updated[index] = {
          ...item,
          refundAmount: Math.max(0, Math.min(amount, maxRefund)),
        };
        return updated;
      });
    },
    [],
  );

  const handleDueAllocationToggle = useCallback(
    (index: number, selected: boolean) => {
      setDueAllocations((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          selected,
          allocatedAmount: selected ? updated[index].dueAmount : 0,
        };
        return updated;
      });
    },
    [],
  );

  const handleDueAllocationAmountChange = useCallback(
    (index: number, amount: number) => {
      setDueAllocations((prev) => {
        const updated = [...prev];
        const due = updated[index];
        updated[index] = {
          ...due,
          allocatedAmount: Math.max(0, Math.min(amount, due.dueAmount)),
        };
        return updated;
      });
    },
    [],
  );

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmitReturn = useCallback(async () => {
    if (!selectedOrderId || !order) {
      toast.error(t("returns.selectOrderFirst"));
      return;
    }

    const selectedItems = returnableItems.filter(
      (i) => i.selected && i.returnQty > 0,
    );
    if (selectedItems.length === 0) {
      toast.error(t("returns.selectItemFirst"));
      return;
    }

    const items = selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      inventoryId: item.inventoryId,
      productName: item.productName || item.product?.name,
      quantity: item.returnQty,
      price: roundMoney(item.price),
      costPrice: roundMoney(item.costPrice || item.price),
      discount: roundMoney(item.discount ?? 0),
      // Tax-inclusive refund, computed per-line via `computeLineTax` (inclusive keeps
      // cost, exclusive adds that line's tax). BE requires it so it never falls back
      // to a net costPrice*qty calc that drops the supplier's tax.
      refundAmount: roundMoney(item.refundAmount),
      ...(item.conversionFactor && item.conversionFactor > 1
        ? { conversionFactor: item.conversionFactor }
        : {}),
    }));

    let refundAllocation:
      | {
          adjustPurchaseDue?: number;
          adjustOtherDues?: {
            dueId: string;
            purchaseOrderId: string;
            amount: number;
          }[];
          accountRefund?: {
            accountId: string;
            amount: number;
            paymentMethod: string;
          };
        }
      | undefined;

    if (isAccountsEnabled && totalRefundAmount > 0) {
      refundAllocation = {};

      // 1. Adjust the due on THIS purchase order (capped at its own due).
      const adjustPurchaseDue = roundMoney(
        Math.min(adjustOrderDueAmount, orderDueAmount),
      );
      if (adjustPurchaseDue > 0) {
        refundAllocation.adjustPurchaseDue = adjustPurchaseDue;
      }

      // 2. Apply credit to other unpaid POs from the same supplier.
      const otherDues = dueAllocations
        .filter((d) => d.selected && d.allocatedAmount > 0)
        .map((d) => ({
          dueId: d.dueId,
          purchaseOrderId: d.purchaseOrderId,
          amount: roundMoney(d.allocatedAmount),
        }))
        .filter((d) => d.amount > 0);
      if (otherDues.length > 0) {
        refundAllocation.adjustOtherDues = otherDues;
      }

      // 3. Cash refund back from supplier into an account.
      if (accountRefundAmount > 0 && selectedAccountId) {
        refundAllocation.accountRefund = {
          accountId: selectedAccountId,
          amount: roundMoney(accountRefundAmount),
          paymentMethod: "cash",
        };
      }

      // 4. Park the remainder as supplier credit balance.
      if (supplierCreditAmount > 0) {
        (refundAllocation as Record<string, unknown>).supplierCredit = {
          amount: roundMoney(supplierCreditAmount),
        };
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        purchaseOrderId: selectedOrderId,
        items,
        reason,
        notes: notes || undefined,
        deductionAmount:
          deductionAmount > 0 ? roundMoney(deductionAmount) : undefined,
        refundAllocation,
      });
      handleClearSearch();
    } catch {
      // mutation handles error toast
    }
  }, [
    selectedOrderId,
    order,
    returnableItems,
    isAccountsEnabled,
    totalRefundAmount,
    dueAllocations,
    adjustOrderDueAmount,
    orderDueAmount,
    accountRefundAmount,
    selectedAccountId,
    supplierCreditAmount,
    createReturnMutation,
    reason,
    notes,
    deductionAmount,
    handleClearSearch,
    t,
  ]);

  // ── Filter config ─────────────────────────────────────────────
  const filterConfig = useMemo(
    () => ({
      fields: [
        {
          name: "status",
          label: t("returns.filterStatus"),
          type: "select" as const,
          options: [
            { label: t("returns.statusPending"), value: "pending" },
            { label: t("returns.statusProcessed"), value: "completed" },
            { label: t("returns.statusCancelled"), value: "cancelled" },
          ],
        },
        {
          name: "reason",
          label: t("returns.filterReason"),
          type: "select" as const,
          options: [
            { label: t("returns.reasonDamaged"), value: "damaged" },
            { label: t("returns.reasonDefective"), value: "defective" },
            { label: t("returns.reasonWrongItem"), value: "wrong_item" },
            { label: t("returns.reasonExpired"), value: "expired" },
            { label: t("returns.reasonQualityIssue"), value: "quality_issue" },
            { label: t("returns.reasonOther"), value: "other" },
          ],
        },
      ] as FilterField[],
      onApply: (newFilters: Record<string, unknown>) => {
        setFilters(newFilters as PurchaseReturnFilters);
        setPage(1);
      },
      onReset: () => {
        setFilters({});
        setPage(1);
      },
    }),
    [t],
  );

  // ── Columns ───────────────────────────────────────────────────
  const returnsColumns = useMemo(
    () =>
      getReturnsColumns(formatCurrency, isAccountsEnabled, handleViewDetails, tReturns),
    [formatCurrency, isAccountsEnabled, handleViewDetails, tReturns],
  );

  // ── Public API ────────────────────────────────────────────────
  return {
    // UI state
    showNewReturn,
    setShowNewReturn,

    // Search
    searchForm,
    handleSearch,
    handleClearSearch,
    selectedOrderId,

    // Order
    order,
    isLoadingOrder,

    // Returns list
    returns,
    isLoadingReturns,
    returnsColumns,
    paginationInfo,
    page,
    limit,
    setPage,
    setLimit,
    filterConfig,

    // Details sheet
    detailsSheetOpen,
    setDetailsSheetOpen,
    selectedReturn,
    handleViewDetails,

    // Items
    returnableItems,
    handleItemSelect,
    handleItemQtyChange,
    handleRefundAmountChange,

    // Return details
    reason,
    setReason,
    notes,
    setNotes,
    deductionAmount,
    setDeductionAmount,
    totalReturnQty,
    grossRefundAmount,
    totalRefundAmount,

    // Refund allocation
    isAccountsEnabled,
    orderDueAmount,
    adjustOrderDueAmount,
    dueAllocations,
    handleDueAllocationToggle,
    handleDueAllocationAmountChange,
    remainingForRefund,
    totalOtherDuesAllocated,
    accountRefundAmount,
    setAccountRefundAmount,
    selectedAccountId,
    setSelectedAccountId,
    supplierCreditAmount,
    setSupplierCreditAmount,
    accounts,
    pendingDues,

    // Init helpers
    initFromOrder,
    initFromPendingDues,

    // Summary
    summary,
    isSummaryLoading,

    // Submit
    handleSubmitReturn,
    createReturnMutation,
    isSubmitting: createReturnMutation.isPending,

    // Utils
    formatCurrency,
  } as const;
}
