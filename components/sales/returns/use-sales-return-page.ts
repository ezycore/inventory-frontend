'use client';
// coding-standard: maintained
import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  useSale,
  useSalesReturns,
  useCreateSalesReturn,
  useCustomerPendingDues,
  useAccountPaymentOptions,
  useSalesReturnsSummary,
} from '@/services/api';
import type { RefundAllocation } from '@/services/api/modules/sales-returns/api';
import { useAuthStore } from '@/services/stores';
import { useCurrency } from '@/lib/currency';
import { roundMoney } from '@/lib/money';
import type {
  Sale,
  SalesReturn,
  SalesReturnReason,
  SalesReturnsSummary,
  SalesReturnFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import type { FilterField } from '@/types/filter';
import { useListUrlState } from '@/hooks/use-list-url-state';
import type { ListFilters } from '@/lib/list-url-state';
import { populatedRef } from '@/utils/populated-ref';

import type { PendingDueRaw } from './types';
import { getReturnsColumns } from './columns';
import { useReturnableItems } from './use-returnable-items';
import { useRefundAllocation } from './use-refund-allocation';

// Message resolved per-locale inside the hook (docs/I18N.md)
const makeSaleSearchSchema = (message: string) =>
  z.object({ saleId: z.string().min(1, message) });

type SaleSearchData = z.infer<ReturnType<typeof makeSaleSearchSchema>>;

export function useSalesReturnPage() {
  const t = useTranslations('sales.returns');
  // ── Core UI state ─────────────────────────────────────────────
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [reason, setReason] = useState<SalesReturnReason>('customer_changed_mind');
  const [notes, setNotes] = useState('');

  // ── Return details sheet ──────────────────────────────────────
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);

  // ── Table pagination & filter ─────────────────────────────────
  const filterFields = useMemo(
    (): FilterField[] => [
      {
        name: 'search',
        label: t('filters.search'),
        type: 'text',
        placeholder: t('filters.searchPlaceholder'),
      },
      {
        name: 'status',
        label: t('filters.status'),
        type: 'select',
        options: [
          { label: t('filters.pending'), value: 'pending' },
          { label: t('filters.processed'), value: 'completed' },
          { label: t('filters.cancelled'), value: 'cancelled' },
        ],
      },
      {
        name: 'reason',
        label: t('filters.reason'),
        type: 'select',
        options: [
          { label: t('reasons.damaged'), value: 'damaged' },
          { label: t('reasons.defective'), value: 'defective' },
          { label: t('reasons.wrongItem'), value: 'wrong_item' },
          { label: t('reasons.customerChangedMind'), value: 'customer_changed_mind' },
          { label: t('reasons.expired'), value: 'expired' },
          { label: t('reasons.other'), value: 'other' },
        ],
      },
    ],
    [t],
  );
  // Page, size and filters live in the URL, so Back from a return lands here again.
  const list = useListUrlState({
    defaults: { limit: 20 },
    filterFields,
    limitOptions: [10, 20, 50, 100],
  });
  const { page, limit, setPage, setLimit } = list;
  const filters = list.filters as SalesReturnFilters;

  // ── Auth & features ───────────────────────────────────────────
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const { format: formatCurrency } = useCurrency();

  // ── API queries ───────────────────────────────────────────────
  const { data: saleData, isLoading: isLoadingSale } = useSale(selectedSaleId ?? '');
  const { data: returnsData, isLoading: isLoadingReturns } = useSalesReturns({
    page,
    limit,
    ...filters,
  });
  // Minimal list — reachable by returns.create (what creating a return
  // actually requires) as well as accounts.view.
  const { data: accountsData } = useAccountPaymentOptions(isAccountsEnabled);
  const { data: summaryData, isLoading: isSummaryLoading } = useSalesReturnsSummary();
  const createReturnMutation = useCreateSalesReturn();

  // ── Derived data ──────────────────────────────────────────────
  const sale = (saleData as ApiResponse<Sale>)?.data;
  const returnsResponse = (returnsData as ApiResponse<PaginatedResponse<SalesReturn>>)?.data;
  const returns: SalesReturn[] = returnsResponse?.items ?? [];
  const accounts = accountsData ?? [];
  const summary = (summaryData as ApiResponse<SalesReturnsSummary>)?.data;

  const paginationInfo = useMemo(() => {
    if (!returnsResponse) return null;
    return {
      total: returnsResponse.total ?? 0,
      totalPages: returnsResponse.totalPages ?? 1,
      hasNext: returnsResponse.hasNext ?? false,
      hasPrev: returnsResponse.hasPrev ?? false,
    };
  }, [returnsResponse]);

  const { data: pendingDuesData } = useCustomerPendingDues(
    populatedRef(sale?.customerId)?._id ?? '',
    selectedSaleId ?? '',
  );
  const pendingDues = useMemo(
    () => (pendingDuesData as ApiResponse<{ dues: PendingDueRaw[] }>)?.data?.dues ?? [],
    [pendingDuesData],
  );

  // ── Sub-hooks ─────────────────────────────────────────────────
  const itemsHook = useReturnableItems();
  const totalRefundAmount = useMemo(
    () => Math.max(0, itemsHook.grossRefundAmount /* deduction subtracted below */),
    [itemsHook.grossRefundAmount],
  );
  // refundAllocation needs deduction applied
  const allocationHook = useRefundAllocation({
    totalRefundAmount: 0, // overridden below
    saleDueAmount: sale?.dueAmount ?? 0,
  });
  const netTotalRefundAmount = Math.max(
    0,
    totalRefundAmount - allocationHook.deductionAmount,
  );
  // Recompute adjustSaleDue + remaining using NET refund (we mirror logic for accuracy)
  const adjustSaleDueAmount = Math.min(netTotalRefundAmount, sale?.dueAmount ?? 0);
  const remainingForRefund = Math.max(
    0,
    netTotalRefundAmount -
      adjustSaleDueAmount -
      allocationHook.totalOtherDuesAllocated -
      allocationHook.customerCreditAmount,
  );

  // ── Search form ───────────────────────────────────────────────
  const searchForm = useForm<SaleSearchData>({
    resolver: zodResolver(makeSaleSearchSchema(t('validation.enterSaleId'))),
    defaultValues: { saleId: '' },
  });

  const handleSearch = useCallback(
    (data: SaleSearchData) => setSelectedSaleId(data.saleId.trim()),
    [],
  );

  const handleClearSearch = useCallback(() => {
    setSelectedSaleId(null);
    itemsHook.resetItems();
    allocationHook.resetAllocation();
    setNotes('');
    searchForm.reset();
  }, [itemsHook, allocationHook, searchForm]);

  const { setFilters, revision: listRevision } = list;
  const filterConfig = useMemo(
    () => ({
      fields: filterFields,
      initialValues: filters,
      // Both start again from page 1.
      onApply: (newFilters: Record<string, unknown>) => setFilters(newFilters as ListFilters),
      onReset: () => setFilters({}),
    }),
    // `filters` seeds the bar once; `listRevision` remounts it after an outside URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
    [filterFields, setFilters, listRevision],
  );

  const initFromSale = useCallback(
    (s: Sale | undefined) => itemsHook.initFromSaleItems(s?.items),
    [itemsHook],
  );
  const initFromPendingDues = useCallback(
    (dues: PendingDueRaw[]) => allocationHook.initFromPendingDues(dues),
    [allocationHook],
  );

  const handleSubmitReturn = useCallback(async () => {
    if (!selectedSaleId || !sale) {
      toast.error(t('toasts.selectSaleFirst'));
      return;
    }

    const items = itemsHook.selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      inventoryId: item.inventoryId,
      productName: item.productName,
      quantity: item.returnQty,
      price: roundMoney(item.price),
      costPrice: roundMoney(item.costPrice),
      discount: roundMoney(item.discount ?? 0),
      taxRate: item.taxRate,
      taxType: item.taxType,
      refundAmount: roundMoney(item.refundAmount),
    }));

    if (items.length === 0) {
      toast.error(t('toasts.selectItems'));
      return;
    }

    let refundAllocation: RefundAllocation | undefined;

    if (isAccountsEnabled && netTotalRefundAmount > 0) {
      refundAllocation = {};

      const saleDueAmount = sale?.dueAmount ?? 0;
      if (adjustSaleDueAmount > 0 && saleDueAmount > 0) {
        refundAllocation.adjustSaleDue = roundMoney(
          Math.min(adjustSaleDueAmount, saleDueAmount),
        );
      }

      const selectedDues = allocationHook.dueAllocations.filter(
        (d) => d.selected && d.allocatedAmount > 0,
      );
      if (selectedDues.length > 0) {
        refundAllocation.adjustOtherDues = selectedDues.map((d) => ({
          dueId: d.dueId,
          saleId: d.saleId,
          amount: roundMoney(d.allocatedAmount),
        }));
      }

      if (allocationHook.accountRefundAmount > 0 && allocationHook.selectedAccountId) {
        refundAllocation.accountRefund = {
          accountId: allocationHook.selectedAccountId,
          amount: roundMoney(allocationHook.accountRefundAmount),
          paymentMethod: 'cash',
        };
      }

      if (allocationHook.customerCreditAmount > 0) {
        refundAllocation.customerCredit = {
          amount: roundMoney(allocationHook.customerCreditAmount),
        };
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        saleId: selectedSaleId,
        items,
        reason,
        notes: notes || undefined,
        deductionAmount:
          allocationHook.deductionAmount > 0
            ? roundMoney(allocationHook.deductionAmount)
            : undefined,
        refundAllocation,
      });
      handleClearSearch();
    } catch {
      // Error handled by mutation
    }
  }, [
    selectedSaleId,
    sale,
    itemsHook,
    isAccountsEnabled,
    netTotalRefundAmount,
    adjustSaleDueAmount,
    allocationHook,
    createReturnMutation,
    reason,
    notes,
    handleClearSearch, t]);

  const handleViewDetails = useCallback((ret: SalesReturn) => {
    setSelectedReturn(ret);
    setDetailsSheetOpen(true);
  }, []);

  const returnsColumns = useMemo(
    () => getReturnsColumns(formatCurrency, isAccountsEnabled, handleViewDetails, t),
    [formatCurrency, isAccountsEnabled, handleViewDetails, t],
  );

  return {
    // form state
    selectedSaleId,
    returnableItems: itemsHook.returnableItems,
    reason,
    setReason,
    notes,
    setNotes,
    deductionAmount: allocationHook.deductionAmount,
    setDeductionAmount: allocationHook.setDeductionAmount,
    dueAllocations: allocationHook.dueAllocations,
    accountRefundAmount: allocationHook.accountRefundAmount,
    setAccountRefundAmount: allocationHook.setAccountRefundAmount,
    selectedAccountId: allocationHook.selectedAccountId,
    setSelectedAccountId: allocationHook.setSelectedAccountId,
    customerCreditAmount: allocationHook.customerCreditAmount,
    setCustomerCreditAmount: allocationHook.setCustomerCreditAmount,
    // derived
    sale,
    returns,
    accounts,
    summary,
    pendingDues,
    isAccountsEnabled,
    formatCurrency,
    isLoadingSale,
    isLoadingReturns,
    isSummaryLoading,
    isSubmitting: createReturnMutation.isPending,
    // pagination
    page,
    limit,
    paginationInfo,
    filterConfig,
    setPage,
    setLimit,
    listRevision,
    // totals
    totalReturnQty: itemsHook.totalReturnQty,
    grossRefundAmount: itemsHook.grossRefundAmount,
    totalRefundAmount: netTotalRefundAmount,
    saleDueAmount: sale?.dueAmount ?? 0,
    adjustSaleDueAmount,
    totalOtherDuesAllocated: allocationHook.totalOtherDuesAllocated,
    remainingForRefund,
    // form
    searchForm,
    // columns
    returnsColumns,
    // handlers
    handleSearch,
    handleClearSearch,
    initFromSale,
    initFromPendingDues,
    handleItemSelect: itemsHook.handleItemSelect,
    handleItemQtyChange: itemsHook.handleItemQtyChange,
    handleRefundAmountChange: itemsHook.handleRefundAmountChange,
    handleDueAllocationToggle: allocationHook.handleDueAllocationToggle,
    handleDueAllocationAmountChange: allocationHook.handleDueAllocationAmountChange,
    handleSubmitReturn,
    // details sheet
    detailsSheetOpen,
    setDetailsSheetOpen,
    selectedReturn,
    handleViewDetails,
  } as const;
}
