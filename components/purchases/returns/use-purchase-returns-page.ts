"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { useCurrency } from "@/lib/currency";
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
  PurchaseOrder,
  PurchaseReturn,
  PurchaseReturnReason,
} from "@/types";

import type { ReturnableItem, DueAllocation } from "./types";
import {
  buildReturnableItems,
  buildDueAllocations,
  extractSupplierId,
  calculateItemRefund,
  calculateMaxRefund,
} from "./helpers";
import { getReturnsColumns, getItemsColumns } from "./columns";

// =====================
// Schema
// =====================

const orderSearchSchema = z.object({
  orderId: z.string().min(1, "Please enter an order ID or order number"),
});

type OrderSearchData = z.infer<typeof orderSearchSchema>;

// =====================
// Hook
// =====================

export function usePurchaseReturnsPage() {
  const searchParams = useSearchParams();
  const { format: formatCurrency } = useCurrency();

  // State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    searchParams.get("orderId"),
  );
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
  const [reason, setReason] = useState<PurchaseReturnReason>("damaged");
  const [notes, setNotes] = useState("");
  const [dueAllocations, setDueAllocations] = useState<DueAllocation[]>([]);
  const [accountRefundAmount, setAccountRefundAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Auth & Features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // API Hooks
  const {
    data: orderData,
    isLoading: isLoadingOrder,
  } = usePurchaseOrder(selectedOrderId || "");
  const { data: returnsData, isLoading: isLoadingReturns } =
    usePurchaseReturns({ limit: 50 });
  const { data: accountsData } = useAccounts();
  const { data: summaryData, isLoading: isSummaryLoading } =
    usePurchaseReturnsSummary();

  // Derived Data
  const order = orderData?.data as PurchaseOrder | undefined;
  const returns = (returnsData?.data?.items || []) as PurchaseReturn[];
  const accounts = (accountsData?.items || []) as any[];
  const summary = summaryData?.data;

  // Supplier ID
  const orderSupplierId = useMemo(() => extractSupplierId(order), [order]);

  const { data: pendingDuesData } = useSupplierPendingDues(
    orderSupplierId,
    selectedOrderId || "",
  );
  const pendingDues = useMemo(
    () => (pendingDuesData as any)?.data || [],
    [pendingDuesData],
  );

  const createReturnMutation = useCreatePurchaseReturn();

  // Form
  const searchForm = useForm<OrderSearchData>({
    resolver: zodResolver(orderSearchSchema),
    defaultValues: { orderId: "" },
  });

  // Initialize returnable items & due allocations
  const initialReturnableItems = useMemo(
    () => (order ? buildReturnableItems(order) : []),
    [order],
  );

  const initialDueAllocations = useMemo(
    () => buildDueAllocations(pendingDues),
    [pendingDues],
  );

  useEffect(() => {
    setReturnableItems(initialReturnableItems);
  }, [initialReturnableItems]);

  useEffect(() => {
    setDueAllocations(initialDueAllocations);
  }, [initialDueAllocations]);

  // Totals
  const totalReturnQty = useMemo(
    () =>
      returnableItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.returnQty, 0),
    [returnableItems],
  );

  const totalRefundAmount = useMemo(
    () =>
      returnableItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.refundAmount, 0),
    [returnableItems],
  );

  const orderDueAmount = order?.dueAmount || 0;

  const adjustOrderDueAmount = useMemo(
    () => Math.min(totalRefundAmount, orderDueAmount),
    [totalRefundAmount, orderDueAmount],
  );

  const totalOtherDuesAllocated = useMemo(
    () =>
      dueAllocations
        .filter((d) => d.selected)
        .reduce((sum, d) => sum + d.allocatedAmount, 0),
    [dueAllocations],
  );

  const remainingForRefund = useMemo(() => {
    const afterOrderDue = totalRefundAmount - adjustOrderDueAmount;
    return Math.max(0, afterOrderDue - totalOtherDuesAllocated);
  }, [totalRefundAmount, adjustOrderDueAmount, totalOtherDuesAllocated]);

  // Handlers
  const handleSearch = useCallback(
    (data: OrderSearchData) => {
      setSelectedOrderId(data.orderId.trim());
    },
    [],
  );

  const handleClearSearch = useCallback(() => {
    setSelectedOrderId(null);
    setReturnableItems([]);
    setDueAllocations([]);
    setAccountRefundAmount(0);
    setNotes("");
    searchForm.reset();
  }, [searchForm]);

  const handleItemSelect = useCallback(
    (index: number, selected: boolean) => {
      setReturnableItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], selected };
        if (!selected) {
          updated[index].returnQty = 0;
          updated[index].refundAmount = 0;
        }
        return updated;
      });
    },
    [],
  );

  const handleItemQtyChange = useCallback(
    (index: number, qty: number) => {
      setReturnableItems((prev) => {
        const updated = [...prev];
        const item = updated[index];
        const validQty = Math.max(0, Math.min(qty, item.maxReturnableQty));
        const calculatedRefund = calculateItemRefund(
          validQty,
          item.conversionFactor,
          item.costPrice,
          item.price,
        );
        updated[index] = {
          ...item,
          returnQty: validQty,
          refundAmount: calculatedRefund,
          selected: validQty > 0,
        };
        return updated;
      });
    },
    [],
  );

  const handleRefundAmountChange = useCallback(
    (index: number, amount: number) => {
      setReturnableItems((prev) => {
        const updated = [...prev];
        const item = updated[index];
        const maxRefund = calculateMaxRefund(
          item.returnQty,
          item.conversionFactor,
          item.costPrice,
          item.price,
        );
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

  const handleSubmitReturn = useCallback(async () => {
    if (!selectedOrderId || !order) {
      toast.error("Please select an order first");
      return;
    }

    const selectedItems = returnableItems.filter(
      (i) => i.selected && i.returnQty > 0,
    );
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    const items = selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      inventoryId: item.inventoryId,
      productName: item.productName || item.product?.name,
      quantity: item.returnQty,
      price: item.price,
      costPrice: item.costPrice || item.price,
      discount: item.discount,
      ...(item.conversionFactor && item.conversionFactor > 1
        ? { conversionFactor: item.conversionFactor }
        : {}),
    }));

    let refundAllocation: any = undefined;
    if (isAccountsEnabled && totalRefundAmount > 0) {
      refundAllocation = {};

      const selectedDues = dueAllocations.filter(
        (d) => d.selected && d.allocatedAmount > 0,
      );
      const totalOtherDueAllocation = selectedDues.reduce(
        (sum, d) => sum + d.allocatedAmount,
        0,
      );

      const totalDueAdjustment =
        Math.min(adjustOrderDueAmount, orderDueAmount) +
        totalOtherDueAllocation;
      if (totalDueAdjustment > 0) {
        refundAllocation.adjustSupplierDue = totalDueAdjustment;
      }

      if (accountRefundAmount > 0 && selectedAccountId) {
        refundAllocation.accountRefund = {
          accountId: selectedAccountId,
          amount: accountRefundAmount,
          paymentMethod: "cash",
        };
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        purchaseOrderId: selectedOrderId,
        items,
        reason,
        notes: notes || undefined,
        refundAllocation,
      });
      handleClearSearch();
    } catch {
      // Error handled by the mutation
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
    createReturnMutation,
    reason,
    notes,
    handleClearSearch,
  ]);

  // Columns (memoized)
  const returnsColumns = useMemo(
    () => getReturnsColumns(isAccountsEnabled, formatCurrency),
    [isAccountsEnabled, formatCurrency],
  );

  const itemsColumns = useMemo(
    () =>
      getItemsColumns(
        formatCurrency,
        handleItemSelect,
        handleItemQtyChange,
        handleRefundAmountChange,
      ),
    [formatCurrency, handleItemSelect, handleItemQtyChange, handleRefundAmountChange],
  );

  return {
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

    // Items
    returnableItems,
    itemsColumns,
    handleItemSelect,
    handleItemQtyChange,
    handleRefundAmountChange,

    // Return details
    reason,
    setReason,
    notes,
    setNotes,
    totalReturnQty,
    totalRefundAmount,

    // Refund allocation
    isAccountsEnabled,
    orderDueAmount,
    adjustOrderDueAmount,
    dueAllocations,
    handleDueAllocationToggle,
    handleDueAllocationAmountChange,
    remainingForRefund,
    accountRefundAmount,
    setAccountRefundAmount,
    selectedAccountId,
    setSelectedAccountId,
    accounts,

    // Summary
    summary,
    isSummaryLoading,

    // Submit
    handleSubmitReturn,
    createReturnMutation,

    // Utils
    formatCurrency,
  };
}
