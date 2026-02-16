'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { Separator } from '@/ui/components/separator';
import {
  Plus,
  CreditCard,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import {
  useSales,
  useSalePayments,
  useAddSalePayment,
  useAccounts,
  useSalesSummary,
} from '@/services/api';
import { useAuthStore } from '@/services/stores/use-auth-store';
import { toast } from 'sonner';
import type { Sale, SaleStatus, Payment, SaleFilters, AddPaymentDto } from '@/types';
import { Skeleton } from '@/ui/components/skeleton';
import { BaseDataTable } from '@/ui/components/dataTable/base-data-table ';
import { DateCell } from '@/ui/components/dataTable/cells/date-cell';
import { useCurrency } from '@/lib/currency';
import type { FilterField } from '@/types/filter';

// Status configuration for badges
const statusConfig: Record<
  SaleStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  draft: { label: 'Draft', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  partial: { label: 'Partial', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
  paid: { label: 'Paid', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  due: { label: 'Due', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
};

export default function SalesHistoryPage() {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // State for pagination and filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<SaleFilters>({});

  // State for modals/drawers
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentsDrawerOpen, setPaymentsDrawerOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Data fetching
  const { data: salesData, isLoading, refetch } = useSales({
    page,
    limit,
    ...filters,
  });

  const { data: paymentsData, isLoading: isLoadingPayments } = useSalePayments(
    selectedSale?._id || ''
  );

  const { data: accountsData } = useAccounts();
  const addPaymentMutation = useAddSalePayment();
  
  // Summary data
  const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
  const summary = summaryData?.data;

  const sales: Sale[] = salesData?.data?.items || [];
  const payments: Payment[] = paymentsData?.data || [];
  const accounts = accountsData?.items || [];

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (!salesData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = salesData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [salesData]);

  // Handlers
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
    setPaymentModalOpen(true);
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
      setPaymentModalOpen(false);
      refetch();
    } catch (error) {
      // Error is handled by mutation's onError
    }
  }, [selectedSale, paymentAmount, paymentAccountId, paymentMethod, paymentNotes, addPaymentMutation, refetch]);

  const formatDateTime = (date: string | Date) => format(new Date(date), 'dd MMM yyyy HH:mm');

  // Table columns
  const columns: ColumnDef<Sale>[] = useMemo(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="font-mono font-medium">{row.original.invoiceNumber}</span>
        ),
      },
      {
        accessorKey: 'saleDate',
        header: 'Sale Date',
        cell: ({ row }) => <DateCell value={row.original.createdAt} />,
      },
      {
        accessorKey: 'customerId',
        header: 'Customer',
        cell: ({ row }) => {
          const customer = row.original.customerId;
          return (
            <span className="font-medium">
              {customer?.name || <span className="text-muted-foreground">Walk-in</span>}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: () => <span className="flex justify-end">Total</span>,
        cell: ({ row }) => (
          <span className="flex justify-end font-medium">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'paidAmount',
        header: () => <span className="flex justify-end">Paid</span>,
        cell: ({ row }) => (
          <span className="flex justify-end text-green-600">
            {formatCurrency(row.original.paidAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'dueAmount',
        header: () => <span className="flex justify-end">Due</span>,
        cell: ({ row }) => (
          <span
            className={`flex justify-end ${
              row.original.dueAmount > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'
            }`}
          >
            {formatCurrency(row.original.dueAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const config = statusConfig[status];
          return (
            <Badge variant={config?.variant} className="flex gap-1 w-fit">
              {config?.icon}
              {config?.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdBy',
        header: 'Created By',
        cell: ({ row }) => {
          const createdBy = row.original.createdBy;
          return createdBy ? (
            <span>{`${createdBy.firstName} ${createdBy.lastName}`}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
    ],
    [formatCurrency]
  );

  // Custom actions for each row
  const customActions = useMemo(
    () => [
      {
        type: 'custom' as const,
        placement: 'cell' as const,
        icon: <Receipt className="h-4 w-4" />,
        label: 'View Payments',
        tooltip: 'View payment history',
        onClick: (row: Sale) => handleViewPayments(row),
      },
      ...(isAccountsEnabled
        ? [
            {
              type: 'custom' as const,
              placement: 'cell' as const,
              icon: <CreditCard className="h-4 w-4" />,
              label: 'Make Payment',
              tooltip: 'Add payment for this sale',
              onClick: (row: Sale) => handleMakePayment(row),
              disabled: (row: Sale) => row.dueAmount <= 0 || row.status === 'cancelled',
            },
          ]
        : []),
    ],
    [handleViewPayments, handleMakePayment, isAccountsEnabled]
  );

  // Filter configuration
  const filterConfig = useMemo(
    () => ({
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { label: 'All Statuses', value: '' },
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
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales History</h1>
          <p className="text-muted-foreground">View and manage your sales</p>
        </div>
        <Button onClick={() => router.push('/sales')}>
          <Plus className="h-4 w-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <div className={`grid gap-4 ${isAccountsEnabled ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        {/* Today's Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-2xl">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(summary?.today?.totalSales ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isSummaryLoading ? '...' : `${summary?.today?.salesCount ?? 0} sale(s)`}
            </p>
          </CardContent>
        </Card>

        {/* This Month's Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(summary?.thisMonth?.totalSales ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isSummaryLoading ? '...' : `${summary?.thisMonth?.salesCount ?? 0} sale(s)`}
            </p>
          </CardContent>
        </Card>

        {/* Total Paid - Only when accounts enabled */}
        {isAccountsEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Paid (All Time)</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {isSummaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(summary?.allTime?.totalPaid ?? 0)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                From {isSummaryLoading ? '...' : `${summary?.allTime?.salesCount ?? 0}`} sale(s)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Total Due - Only when accounts enabled */}
        {isAccountsEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Due (All Time)</CardDescription>
              <CardTitle className={`text-2xl ${(summary?.allTime?.totalDue ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {isSummaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(summary?.allTime?.totalDue ?? 0)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Outstanding balance
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            {paginationInfo ? `${paginationInfo.total} sale(s) found` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseDataTable
            columns={columns}
            data={sales}
            isLoading={isLoading}
            filterConfig={filterConfig}
            actions={{}}
            customActions={customActions}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
              totalPages: paginationInfo?.totalPages || 1,
              totalItems: paginationInfo?.total || 0,
              hasNext: paginationInfo?.hasNext || false,
              hasPrev: paginationInfo?.hasPrev || false,
              manualPagination: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPaginationChange: ({ pageIndex, pageSize }) => {
                setPage(pageIndex + 1);
                if (pageSize !== limit) setLimit(pageSize);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* View Payments Drawer */}
      <Sheet open={paymentsDrawerOpen} onOpenChange={setPaymentsDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payments - {selectedSale?.invoiceNumber}
            </SheetTitle>
            <SheetDescription>Payment history for this sale</SheetDescription>
          </SheetHeader>

          {selectedSale && (
            <div className="space-y-6 mt-6">
              {/* Sale Summary */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(selectedSale.paidAmount)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Due Amount</span>
                  <span
                    className={`font-bold ${
                      selectedSale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(selectedSale.dueAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Action Button */}
              {isAccountsEnabled && selectedSale.dueAmount > 0 && selectedSale.status !== 'cancelled' && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setPaymentsDrawerOpen(false);
                    handleMakePayment(selectedSale);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              )}

              {/* Payments List */}
              <div>
                <h4 className="font-medium mb-3">Payment History</h4>

                {isLoadingPayments ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-green-600">
                              +{formatCurrency(payment.amount)}
                            </span>
                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(payment.createdAt)}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {payment.paymentMethod}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Wallet className="h-3 w-3" />
                          {payment.accountId?.name || 'Unknown Account'}
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground">{payment.notes}</p>
                        )}
                        {payment.createdBy && (
                          <p className="text-xs text-muted-foreground">
                            By {payment.createdBy.firstName} {payment.createdBy.lastName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Make Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Payment
            </DialogTitle>
            <DialogDescription>
              Add payment for invoice {selectedSale?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {/* Due Amount Info */}
              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Due Amount</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedSale.dueAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedSale.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              {/* Payment Account */}
              <div className="space-y-2">
                <Label htmlFor="account">Payment Account</Label>
                <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mfs">Mobile Banking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={addPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={addPaymentMutation.isPending || !paymentAccountId || !paymentAmount}
            >
              {addPaymentMutation.isPending ? 'Processing...' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
