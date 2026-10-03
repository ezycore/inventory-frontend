'use client';
// coding-standard: maintained
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Card, CardContent } from '@/ui/components/card';
import { BaseDataTable } from '@/ui/components/dataTable/base-data-table ';

import {
  useSalesHistoryPage,
  SummaryCards,
  PaymentsDrawer,
} from '@/components/sales/history';
import { useAuthStore } from '@/services/stores/use-auth-store';
import { isFeatureEnabled } from '@/lib/feature-utils';
import { openPos } from '@/constants/pos';

export default function SalesHistoryPage() {
  const t = useTranslations('sales.history');
  const ctx = useSalesHistoryPage();
  // History stays READABLE when the counter is switched off — that is what
  // `readOnly` on the nav item means, and why a year of sales does not vanish
  // with the capability. It does not mean the screen never creates.
  //
  // What the flag never covered is this button, which pushes to the POS — a
  // route the guard blocks once the capability is off. The twin screen
  // `/purchases/history` was given this exact guard and this one was missed,
  // so an online-only merchant is offered a counter sale they cannot start
  // (QA-R23, same shape as QA-L6).
  const canCreateSale = isFeatureEnabled(
    useAuthStore((s) => s.user?.organization?.features),
    'sales',
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {canCreateSale && (
          <Button onClick={() => openPos()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newSale')}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <SummaryCards
        summary={ctx.summary}
        isLoading={ctx.isSummaryLoading}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Data Table */}
      <Card className="p-0">
        <CardContent className="p-6">
          <BaseDataTable
            key={ctx.listRevision}
            title={t('tableTitle')}
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
                if (pageSize !== ctx.limit) ctx.setLimit(pageSize);
                else ctx.setPage(pageIndex + 1);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* Sale Details & Payment Drawer */}
      <PaymentsDrawer
        open={ctx.drawerOpen}
        onOpenChange={ctx.setDrawerOpen}
        sale={ctx.selectedSale}
        payments={ctx.payments}
        isLoadingPayments={ctx.isLoadingPayments}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
        mode={ctx.drawerMode}
        accounts={ctx.accounts}
        paymentAmount={ctx.paymentAmount}
        setPaymentAmount={ctx.setPaymentAmount}
        paymentAccountId={ctx.paymentAccountId}
        setPaymentAccountId={ctx.setPaymentAccountId}
        paymentNotes={ctx.paymentNotes}
        setPaymentNotes={ctx.setPaymentNotes}
        useCreditBalance={ctx.useCreditBalance}
        setUseCreditBalance={ctx.setUseCreditBalance}
        isSubmittingPayment={ctx.isSubmittingPayment}
        onMakePayment={ctx.handleMakePayment}
        onSubmitPayment={ctx.handlePaymentSubmit}
        drawerRef={ctx.drawerRef}
        saleReturns={ctx.saleReturns}
        isLoadingReturns={ctx.isLoadingReturns}
        transactions={ctx.transactions}
        isLoadingTransactions={ctx.isLoadingTransactions}
        onNavigateToSale={ctx.handleNavigateToSale}
      />
    </div>
  );
}
