'use client';
// coding-standard: maintained
import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  useSales,
  useSalePayments,
  useSaleTransactions,
  useAddSalePayment,
  useAccountPaymentOptions,
  useSalesSummary,
  useSaleReturns,
  useDeleteDraftSale,
  salesApi,
} from '@/services/api';
import { useAuthStore } from '@/services/stores/use-auth-store';
import { useCurrency } from '@/lib/currency';
import type { Sale, Payment, SaleFilters, AddPaymentDto, SalesReturn } from '@/types';
import type { FilterField } from '@/types/filter';

import { getSalesHistoryColumns, getSalesHistoryActions } from './columns';

// ── Hook ────────────────────────────────────────────────────────────

export function useSalesHistoryPage() {
  const t = useTranslations('sales.history');
  // ── Auth & features ───────────────────────────────────────────
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const { format: formatCurrency } = useCurrency();
  const router = useRouter();

  // ── Table state ───────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<SaleFilters>({});

  // ── Modal state ───────────────────────────────────────────────
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'summary' | 'payment'>('summary');
  const drawerRef = useRef<HTMLDivElement>(null);

  // ── Payment form state ────────────────────────────────────────
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');  const [useCreditBalance, setUseCreditBalance] = useState(false);
  // ── API queries ───────────────────────────────────────────────
  const { data: salesData, isLoading, refetch } = useSales({ page, limit, ...filters });
  const { data: paymentsData, isLoading: isLoadingPayments } = useSalePayments(
    selectedSale?._id || '',
  );
  const { data: transactionsData, isLoading: isLoadingTransactions } = useSaleTransactions(
    selectedSale?._id || '',
  );
  const { data: saleReturnsData, isLoading: isLoadingReturns } = useSaleReturns(
    selectedSale?._id || '',
  );
  // Minimal list — reachable by sales.edit (what recording a payment
  // actually requires) as well as accounts.view.
  const { data: accountsData } = useAccountPaymentOptions(isAccountsEnabled);
  const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
  const addPaymentMutation = useAddSalePayment();
  const deleteDraftMutation = useDeleteDraftSale();

  // ── Derived data ──────────────────────────────────────────────
  const sales: Sale[] = salesData?.data?.items || [];
  const payments: Payment[] = paymentsData?.data || [];  const transactions = transactionsData?.data;  const saleReturns: SalesReturn[] = (saleReturnsData as any)?.data?.returns || [];
  const accounts = accountsData || [];
  const summary = summaryData?.data;

  const paginationInfo = useMemo(() => {
    if (!salesData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = salesData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [salesData]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleViewSummary = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setDrawerMode('summary');
    setDrawerOpen(true);
  }, []);

  const handleMakePayment = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setDrawerMode('payment');
    setPaymentAmount(sale.dueAmount.toFixed(2));
    setPaymentAccountId('');
    setPaymentNotes('');
    setUseCreditBalance(false);
    setDrawerOpen(true);
  }, []);

  const handleNavigateToSale = useCallback(async (saleId: string) => {
    try {
      const response = await salesApi.getById(saleId);
      const sale = response?.data as Sale | undefined;
      if (sale) {
        setSelectedSale(sale);
        setDrawerMode('summary');
        setDrawerOpen(true);
      }
    } catch {
      toast.error(t('toasts.loadSaleFailed'));
    }
  }, [t]);

  const handleEditDraft = useCallback((sale: Sale) => {
    router.push(`/sales?draftId=${sale._id}`);
  }, [router]);

  const handleDeleteDraft = useCallback(async (sale: Sale) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        `Permanently delete draft ${sale.invoiceNumber}? This cannot be undone.`,
      );
      if (!ok) return;
    }
    try {
      await deleteDraftMutation.mutateAsync(sale._id);
    } catch {
      // toast already shown by mutation
    }
  }, [deleteDraftMutation]);

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedSale) return;
    if (!useCreditBalance && !paymentAccountId) {
      toast.error(t('toasts.selectPaymentAccount'));
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('toasts.invalidAmount'));
      return;
    }
    if (amount > selectedSale.dueAmount) {
      toast.error(t('toasts.exceedsDue'));
      return;
    }
    try {
      const payload: AddPaymentDto & { saleId: string } = useCreditBalance
        ? { saleId: selectedSale._id, amount, useCreditBalance: true, notes: paymentNotes || undefined }
        : { saleId: selectedSale._id, amount, accountId: paymentAccountId, notes: paymentNotes || undefined };
      const response = await addPaymentMutation.mutateAsync(payload);
      if (response.data?.sale) {
        setSelectedSale(response.data.sale);
      }
      setDrawerMode('summary');
      setPaymentAmount('');
      setUseCreditBalance(false);
      toast.success(t('toasts.paymentRecorded'));
      refetch();
    } catch {
      // Handled by mutation's onError
    }
  }, [
    selectedSale, paymentAmount, paymentAccountId,
    paymentNotes, useCreditBalance, addPaymentMutation, refetch, t,
  ]);

  // ── Filter config ─────────────────────────────────────────────
  const filterConfig = useMemo(
    () => ({
      fields: [
        {
          name: 'status',
          label: t('filters.status'),
          type: 'select' as const,
          options: [
            { label: t('filters.draft'), value: 'draft' },
            { label: t('filters.paid'), value: 'paid' },
            { label: t('filters.partial'), value: 'partial' },
            { label: t('filters.due'), value: 'due' },
            { label: t('filters.cancelled'), value: 'cancelled' },
          ],
        },
        {
          name: 'search',
          label: t('filters.search'),
          type: 'text' as const,
          placeholder: t('filters.searchPlaceholder'),
        },
      ] as FilterField[],
      onApply: (newFilters: Record<string, unknown>) => {
        setFilters(newFilters as SaleFilters);
        setPage(1);
      },
      onReset: () => {
        setFilters({});
        setPage(1);
      },
    }),
    [t],
  );

  // ── Table columns & actions (memoised) ────────────────────────
  const columns = useMemo(
    () => getSalesHistoryColumns(formatCurrency, isAccountsEnabled, handleViewSummary, handleMakePayment, t),
    [formatCurrency, isAccountsEnabled, handleViewSummary, handleMakePayment, t],
  );

  const customActions = useMemo(
    () => getSalesHistoryActions(isAccountsEnabled, handleViewSummary, handleMakePayment, handleEditDraft, handleDeleteDraft, t),
    [isAccountsEnabled, handleViewSummary, handleMakePayment, handleEditDraft, handleDeleteDraft, t],
  );

  // ── Public API ────────────────────────────────────────────────
  return {
    // features
    isAccountsEnabled,
    formatCurrency,

    // table
    sales,
    isLoading,
    page,
    limit,
    setPage,
    setLimit,
    paginationInfo,
    filterConfig,
    columns,
    customActions,

    // summary
    summary,
    isSummaryLoading,

    // drawer
    selectedSale,
    drawerOpen,
    setDrawerOpen,
    drawerMode,
    setDrawerMode,
    drawerRef,
    payments,
    isLoadingPayments,
    transactions,
    isLoadingTransactions,
    saleReturns,
    isLoadingReturns,

    // payment form
    accounts,
    paymentAmount,
    setPaymentAmount,
    paymentAccountId,
    setPaymentAccountId,
    paymentNotes,
    setPaymentNotes,
    useCreditBalance,
    setUseCreditBalance,
    isSubmittingPayment: addPaymentMutation.isPending,

    // handlers
    handleViewSummary,
    handleMakePayment,
    handlePaymentSubmit,
    handleNavigateToSale,
    handleEditDraft,
    handleDeleteDraft,
  } as const;
}
