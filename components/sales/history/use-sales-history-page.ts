'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

import {
  useSales,
  useSalePayments,
  useAddSalePayment,
  useAccounts,
  useSalesSummary,
} from '@/services/api';
import { useAuthStore } from '@/services/stores/use-auth-store';
import { useCurrency } from '@/lib/currency';
import type { Sale, Payment, SaleFilters, AddPaymentDto } from '@/types';
import type { FilterField } from '@/types/filter';

import { getSalesHistoryColumns, getSalesHistoryActions } from './columns';

// ── Hook ────────────────────────────────────────────────────────────

export function useSalesHistoryPage() {
  // ── Auth & features ───────────────────────────────────────────
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const { format: formatCurrency } = useCurrency();

  // ── Table state ───────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<SaleFilters>({});

  // ── Modal state ───────────────────────────────────────────────
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentsDrawerOpen, setPaymentsDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // ── Payment form state ────────────────────────────────────────
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // ── API queries ───────────────────────────────────────────────
  const { data: salesData, isLoading, refetch } = useSales({ page, limit, ...filters });
  const { data: paymentsData, isLoading: isLoadingPayments } = useSalePayments(
    selectedSale?._id || '',
  );
  const { data: accountsData } = useAccounts();
  const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
  const addPaymentMutation = useAddSalePayment();

  // ── Derived data ──────────────────────────────────────────────
  const sales: Sale[] = salesData?.data?.items || [];
  const payments: Payment[] = paymentsData?.data || [];
  const accounts = accountsData?.items || [];
  const summary = summaryData?.data;

  const paginationInfo = useMemo(() => {
    if (!salesData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = salesData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [salesData]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleViewPayments = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setPaymentsDrawerOpen(true);
  }, []);

  const handleMakePayment = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setPaymentAmount(sale.dueAmount.toFixed(2));
    setPaymentAccountId('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedSale || !paymentAccountId) {
      toast.error('Please select a payment account');
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > selectedSale.dueAmount) {
      toast.error('Payment amount cannot exceed due amount');
      return;
    }
    try {
      await addPaymentMutation.mutateAsync({
        saleId: selectedSale._id,
        amount,
        accountId: paymentAccountId,
        paymentMethod: paymentMethod as AddPaymentDto['paymentMethod'],
        notes: paymentNotes || undefined,
      });
      setPaymentDialogOpen(false);
      refetch();
    } catch {
      // Handled by mutation's onError
    }
  }, [
    selectedSale, paymentAmount, paymentAccountId,
    paymentMethod, paymentNotes, addPaymentMutation, refetch,
  ]);

  // ── Filter config ─────────────────────────────────────────────
  const filterConfig = useMemo(
    () => ({
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { label: 'Paid', value: 'paid' },
            { label: 'Partial', value: 'partial' },
            { label: 'Draft', value: 'draft' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
        {
          name: 'search',
          label: 'Search',
          type: 'text' as const,
          placeholder: 'Invoice number, notes...',
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
    [],
  );

  // ── Table columns & actions (memoised) ────────────────────────
  const columns = useMemo(
    () => getSalesHistoryColumns(formatCurrency, isAccountsEnabled, handleViewPayments, handleMakePayment),
    [formatCurrency, isAccountsEnabled, handleViewPayments, handleMakePayment],
  );

  const customActions = useMemo(
    () => getSalesHistoryActions(isAccountsEnabled, handleViewPayments, handleMakePayment),
    [isAccountsEnabled, handleViewPayments, handleMakePayment],
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

    // payments drawer
    selectedSale,
    payments,
    isLoadingPayments,
    paymentsDrawerOpen,
    setPaymentsDrawerOpen,

    // payment dialog
    accounts,
    paymentAmount,
    setPaymentAmount,
    paymentAccountId,
    setPaymentAccountId,
    paymentMethod,
    setPaymentMethod,
    paymentNotes,
    setPaymentNotes,
    paymentDialogOpen,
    setPaymentDialogOpen,
    isSubmittingPayment: addPaymentMutation.isPending,

    // handlers
    handleViewPayments,
    handleMakePayment,
    handlePaymentSubmit,
  } as const;
}
