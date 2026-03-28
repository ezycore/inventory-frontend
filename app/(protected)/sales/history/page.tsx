'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { BaseDataTable } from '@/ui/components/dataTable/base-data-table ';

import {
  useSalesHistoryPage,
  SummaryCards,
  PaymentsDrawer,
  PaymentDialog,
} from '@/components/sales/history';

export default function SalesHistoryPage() {
  const router = useRouter();
  const ctx = useSalesHistoryPage();

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

      {/* Summary Stats */}
      <SummaryCards
        summary={ctx.summary}
        isLoading={ctx.isSummaryLoading}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            {ctx.paginationInfo
              ? `${ctx.paginationInfo.total} sale(s) found`
              : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseDataTable
            columns={ctx.columns}
            data={ctx.sales}
            isLoading={ctx.isLoading}
            filterConfig={ctx.filterConfig}
            customActions={ctx.customActions}
            pagination={{
              pageIndex: ctx.page - 1,
              pageSize: ctx.limit,
              totalPages: ctx.paginationInfo?.totalPages ?? 1,
              totalItems: ctx.paginationInfo?.total ?? 0,
              hasNext: ctx.paginationInfo?.hasNext ?? false,
              hasPrev: ctx.paginationInfo?.hasPrev ?? false,
              manualPagination: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPaginationChange: ({ pageIndex, pageSize }) => {
                ctx.setPage(pageIndex + 1);
                if (pageSize !== ctx.limit) ctx.setLimit(pageSize);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* View Payments Drawer */}
      <PaymentsDrawer
        open={ctx.paymentsDrawerOpen}
        onOpenChange={ctx.setPaymentsDrawerOpen}
        sale={ctx.selectedSale}
        payments={ctx.payments}
        isLoadingPayments={ctx.isLoadingPayments}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
        onMakePayment={ctx.handleMakePayment}
      />

      {/* Make Payment Dialog */}
      <PaymentDialog
        open={ctx.paymentDialogOpen}
        onOpenChange={ctx.setPaymentDialogOpen}
        sale={ctx.selectedSale}
        accounts={ctx.accounts}
        formatCurrency={ctx.formatCurrency}
        paymentAmount={ctx.paymentAmount}
        setPaymentAmount={ctx.setPaymentAmount}
        paymentAccountId={ctx.paymentAccountId}
        setPaymentAccountId={ctx.setPaymentAccountId}
        paymentMethod={ctx.paymentMethod}
        setPaymentMethod={ctx.setPaymentMethod}
        paymentNotes={ctx.paymentNotes}
        setPaymentNotes={ctx.setPaymentNotes}
        isSubmitting={ctx.isSubmittingPayment}
        onSubmit={ctx.handlePaymentSubmit}
      />
    </div>
  );
}
