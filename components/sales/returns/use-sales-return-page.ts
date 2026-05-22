'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  useSale,
  useSalesReturns,
  useCreateSalesReturn,
  useCustomerPendingDues,
  useAccounts,
  useSalesReturnsSummary,
} from '@/services/api';
import type { RefundAllocation } from '@/services/api/modules/sales-returns/api';
import { useAuthStore } from '@/services/stores';
import { useCurrency } from '@/lib/currency';
import type {
  Sale,
  SaleItem,
  SalesReturn,
  SalesReturnReason,
  SalesReturnsSummary,
  SalesReturnFilters,
  Account,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import type { FilterField } from '@/types/filter';

import type {
  ReturnableItem,
  DueAllocation,
  PendingDueRaw,
} from './types';
import { getReturnsColumns } from './columns';

// ── Search schema ───────────────────────────────────────────────────

const saleSearchSchema = z.object({
  saleId: z.string().min(1, 'Please enter a sale ID or invoice number'),
});

type SaleSearchData = z.infer<typeof saleSearchSchema>;

// ── Hook ────────────────────────────────────────────────────────────

export function useSalesReturnPage() {
  // ── State ─────────────────────────────────────────────────────
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
  const [reason, setReason] = useState<SalesReturnReason>('customer_changed_mind');
  const [notes, setNotes] = useState('');
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [dueAllocations, setDueAllocations] = useState<DueAllocation[]>([]);
  const [accountRefundAmount, setAccountRefundAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [customerCreditAmount, setCustomerCreditAmount] = useState(0);

  // ── Return details sheet state ────────────────────────────────
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);

  // ── Table pagination & filter state ───────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<SalesReturnFilters>({});

  // ── Auth & Features ───────────────────────────────────────────
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const { format: formatCurrency } = useCurrency();

  // ── API Queries ───────────────────────────────────────────────
  const { data: saleData, isLoading: isLoadingSale } = useSale(
    selectedSaleId ?? '',
  );
  const { data: returnsData, isLoading: isLoadingReturns } = useSalesReturns({
    page,
    limit,
    ...filters,
  });
  const { data: accountsData } = useAccounts(
    isAccountsEnabled ? { status: 'active', limit: 100 } : undefined,
  );
  const { data: summaryData, isLoading: isSummaryLoading } =
    useSalesReturnsSummary();
  const createReturnMutation = useCreateSalesReturn();

  // ── Derived data ──────────────────────────────────────────────
  const sale = (saleData as ApiResponse<Sale>)?.data;
  const returnsResponse = (returnsData as ApiResponse<PaginatedResponse<SalesReturn>>)?.data;
  const returns: SalesReturn[] = returnsResponse?.items ?? [];
  const accounts: Account[] =
    (accountsData as PaginatedResponse<Account>)?.items ?? [];
  const summary = (summaryData as ApiResponse<SalesReturnsSummary>)?.data;

  // ── Pagination info ───────────────────────────────────────────
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
    sale?.customerId?._id ?? '',
    selectedSaleId ?? '',
  );
  const pendingDues = useMemo(
    () =>
      (pendingDuesData as ApiResponse<{ dues: PendingDueRaw[] }>)?.data?.dues ?? [],
    [pendingDuesData],
  );

  // ── Form ──────────────────────────────────────────────────────
  const searchForm = useForm<SaleSearchData>({
    resolver: zodResolver(saleSearchSchema),
    defaultValues: { saleId: '' },
  });

  // ── Build returnable items from fetched sale ──────────────────
  const buildReturnableItems = useCallback(
    (saleItems: SaleItem[]): ReturnableItem[] =>
      saleItems.map((item) => {
        const salePrice = item.price - (item.discount ?? 0);
        return {
          ...item,
          inventoryId: item.inventoryId ?? item.productId,
          maxReturnableQty:
            item.quantity -
            ((item as SaleItem & { returnedQuantity?: number }).returnedQuantity ?? 0),
          returnQty: 0,
          refundAmount: 0,
          selected: false,
          salePrice,
        };
      }),
    [],
  );

  // ── Build due allocations from pending dues ───────────────────
  const buildDueAllocations = useCallback(
    (dues: PendingDueRaw[]): DueAllocation[] =>
      dues.map((due) => {
        const extractedSaleId =
          typeof due.saleId === 'object' && due.saleId?._id
            ? due.saleId._id
            : String(due.saleId);
        const extractedInvoice =
          typeof due.saleId === 'object' && due.saleId?.invoiceNumber
            ? due.saleId.invoiceNumber
            : (due.invoiceNumber ?? '');
        return {
          dueId: due.id ?? due._id ?? '',
          saleId: extractedSaleId,
          invoiceNumber: extractedInvoice,
          dueAmount: due.currentAmount,
          allocatedAmount: 0,
          selected: false,
        };
      }),
    [],
  );

  // ── Computed totals ───────────────────────────────────────────
  const selectedItems = useMemo(
    () => returnableItems.filter((i) => i.selected && i.returnQty > 0),
    [returnableItems],
  );
  const totalReturnQty = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.returnQty, 0),
    [selectedItems],
  );
  const grossRefundAmount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.refundAmount, 0),
    [selectedItems],
  );
  const totalRefundAmount = useMemo(
    () => Math.max(0, grossRefundAmount - deductionAmount),
    [grossRefundAmount, deductionAmount],
  );
  const saleDueAmount = sale?.dueAmount ?? 0;
  const adjustSaleDueAmount = useMemo(
    () => Math.min(totalRefundAmount, saleDueAmount),
    [totalRefundAmount, saleDueAmount],
  );
  const totalOtherDuesAllocated = useMemo(
    () =>
      dueAllocations
        .filter((d) => d.selected)
        .reduce((sum, d) => sum + d.allocatedAmount, 0),
    [dueAllocations],
  );
  const remainingForRefund = useMemo(() => {
    const afterSaleDue = totalRefundAmount - adjustSaleDueAmount;
    return Math.max(
      0,
      afterSaleDue - totalOtherDuesAllocated - customerCreditAmount,
    );
  }, [
    totalRefundAmount,
    adjustSaleDueAmount,
    totalOtherDuesAllocated,
    customerCreditAmount,
  ]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleSearch = useCallback(
    (data: SaleSearchData) => setSelectedSaleId(data.saleId.trim()),
    [],
  );

  const handleClearSearch = useCallback(() => {
    setSelectedSaleId(null);
    setReturnableItems([]);
    setDueAllocations([]);
    setDeductionAmount(0);
    setAccountRefundAmount(0);
    setSelectedAccountId('');
    setCustomerCreditAmount(0);
    setNotes('');
    setShowNewReturn(false);
    searchForm.reset();
  }, [searchForm]);

  // ── Table filter config ───────────────────────────────────────
  const filterConfig = useMemo(
    () => ({
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
        {
          name: 'reason',
          label: 'Reason',
          type: 'select' as const,
          options: [
            { label: 'Damaged', value: 'damaged' },
            { label: 'Defective', value: 'defective' },
            { label: 'Wrong Item', value: 'wrong_item' },
            { label: 'Customer Changed Mind', value: 'customer_changed_mind' },
            { label: 'Expired', value: 'expired' },
            { label: 'Other', value: 'other' },
          ],
        },
      ] as FilterField[],
      onApply: (newFilters: Record<string, unknown>) => {
        setFilters(newFilters as SalesReturnFilters);
        setPage(1);
      },
      onReset: () => {
        setFilters({});
        setPage(1);
      },
    }),
    [],
  );

  /** Call after sale data loads to populate returnable items */
  const initFromSale = useCallback(
    (s: Sale | undefined) => {
      if (s?.items) {
        setReturnableItems(buildReturnableItems(s.items));
      }
    },
    [buildReturnableItems],
  );

  /** Call after pending dues data loads to populate allocations */
  const initFromPendingDues = useCallback(
    (dues: PendingDueRaw[]) => {
      if (dues.length) {
        setDueAllocations(buildDueAllocations(dues));
      }
    },
    [buildDueAllocations],
  );

  const handleItemSelect = useCallback(
    (index: number, selected: boolean) => {
      setReturnableItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          selected,
          ...(selected ? {} : { returnQty: 0, refundAmount: 0 }),
        };
        return updated;
      });
    },
    [],
  );

  const handleItemQtyChange = useCallback((index: number, qty: number) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validQty = Math.max(0, Math.min(qty, item.maxReturnableQty));
      updated[index] = {
        ...item,
        returnQty: validQty,
        refundAmount: validQty * (item.salePrice || item.price),
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
        const maxRefund = item.returnQty * (item.salePrice || item.price);
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
    if (!selectedSaleId || !sale) {
      toast.error('Please select a sale first');
      return;
    }

    const items = selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      inventoryId: item.inventoryId,
      productName: item.productName,
      quantity: item.returnQty,
      price: item.price,
      costPrice: item.costPrice,
      discount: item.discount,
      refundAmount: item.refundAmount,
    }));

    if (items.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    let refundAllocation: RefundAllocation | undefined;

    if (isAccountsEnabled && totalRefundAmount > 0) {
      refundAllocation = {};

      if (adjustSaleDueAmount > 0 && saleDueAmount > 0) {
        refundAllocation.adjustSaleDue = Math.min(adjustSaleDueAmount, saleDueAmount);
      }

      const selectedDues = dueAllocations.filter(
        (d) => d.selected && d.allocatedAmount > 0,
      );
      if (selectedDues.length > 0) {
        refundAllocation.adjustOtherDues = selectedDues.map((d) => ({
          dueId: d.dueId,
          saleId: d.saleId,
          amount: d.allocatedAmount,
        }));
      }

      if (accountRefundAmount > 0 && selectedAccountId) {
        refundAllocation.accountRefund = {
          accountId: selectedAccountId,
          amount: accountRefundAmount,
          paymentMethod: 'cash',
        };
      }

      if (customerCreditAmount > 0) {
        refundAllocation.customerCredit = { amount: customerCreditAmount };
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        saleId: selectedSaleId,
        items,
        reason,
        notes: notes || undefined,
        deductionAmount: deductionAmount > 0 ? deductionAmount : undefined,
        refundAllocation,
      });
      handleClearSearch();
    } catch {
      // Error handled by mutation
    }
  }, [
    selectedSaleId,
    sale,
    selectedItems,
    isAccountsEnabled,
    totalRefundAmount,
    adjustSaleDueAmount,
    saleDueAmount,
    dueAllocations,
    accountRefundAmount,
    selectedAccountId,
    customerCreditAmount,
    createReturnMutation,
    reason,
    notes,
    deductionAmount,
    handleClearSearch,
  ]);

  // ── Columns (memoised) ────────────────────────────────────────
  const handleViewDetails = useCallback((ret: SalesReturn) => {
    setSelectedReturn(ret);
    setDetailsSheetOpen(true);
  }, []);

  const returnsColumns = useMemo(
    () => getReturnsColumns(formatCurrency, isAccountsEnabled, handleViewDetails),
    [formatCurrency, isAccountsEnabled, handleViewDetails],
  );

  // ── Public API ────────────────────────────────────────────────
  return {
    // UI state
    showNewReturn,
    setShowNewReturn,

    // return form state
    selectedSaleId,
    returnableItems,
    reason,
    setReason,
    notes,
    setNotes,
    deductionAmount,
    setDeductionAmount,
    dueAllocations,
    accountRefundAmount,
    setAccountRefundAmount,
    selectedAccountId,
    setSelectedAccountId,
    customerCreditAmount,
    setCustomerCreditAmount,

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

    // table pagination & filters
    page,
    limit,
    paginationInfo,
    filterConfig,
    setPage,
    setLimit,

    // computed totals
    totalReturnQty,
    grossRefundAmount,
    totalRefundAmount,
    saleDueAmount,
    adjustSaleDueAmount,
    totalOtherDuesAllocated,
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
    handleItemSelect,
    handleItemQtyChange,
    handleRefundAmountChange,
    handleDueAllocationToggle,
    handleDueAllocationAmountChange,
    handleSubmitReturn,

    // details sheet
    detailsSheetOpen,
    setDetailsSheetOpen,
    selectedReturn,
    handleViewDetails,
  } as const;
}
