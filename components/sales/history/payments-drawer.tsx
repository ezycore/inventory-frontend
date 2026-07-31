'use client';
// coding-standard: maintained

import { CreditCard, ReceiptText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRef } from 'react';
import type { AppLocale } from '@/i18n/config';
import { useAuthStore } from '@/services/stores';
import { PrintMenu } from '@/components/shared/print/print-menu';
import { SheetHeaderBar } from '@/components/shared/print/sheet-header-bar';
import {
  EmptySectionsLine,
  NoteCallout,
  SectionFold,
} from '@/components/shared/detail-sheet';
import {
  orgToPrintHeader,
  printSaleInvoice,
  resolveDefaultPaper,
} from '@/utils/print-documents';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { CopyField } from '@/ui/components/copy';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import type {
  Account,
  Payment,
  Sale,
  SalesReturn,
  SaleTransactionsResponse,
} from '@/types';
import { statusConfig } from './columns';
import { EmailReceiptButton } from './email-receipt-button';
import { PaymentEntryForm } from './payment-entry-form';
import { PaymentHistoryList } from './payment-history-list';
import { ReturnsHistoryList } from './returns-history-list';
import { SaleDetailsKv, SaleItemsTable, SaleStats } from './sale-details-block';
import { TransactionsTimeline } from './transactions-timeline';

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  mode: 'summary' | 'payment';
  accounts: Account[];
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (value: string) => void;
  paymentNotes: string;
  setPaymentNotes: (value: string) => void;
  useCreditBalance: boolean;
  setUseCreditBalance: (value: boolean) => void;
  isSubmittingPayment: boolean;
  onMakePayment: (sale: Sale) => void;
  onSubmitPayment: () => void;
  drawerRef?: React.RefObject<HTMLDivElement>;
  saleReturns: SalesReturn[];
  isLoadingReturns: boolean;
  transactions?: SaleTransactionsResponse;
  isLoadingTransactions?: boolean;
  onNavigateToSale?: (saleId: string) => void;
}

export function PaymentsDrawer({
  open,
  onOpenChange,
  sale,
  payments,
  isLoadingPayments,
  isAccountsEnabled,
  formatCurrency,
  mode,
  accounts,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentNotes,
  setPaymentNotes,
  useCreditBalance,
  setUseCreditBalance,
  isSubmittingPayment,
  onMakePayment,
  onSubmitPayment,
  drawerRef: externalRef,
  saleReturns,
  isLoadingReturns,
  transactions,
  isLoadingTransactions,
  onNavigateToSale,
}: PaymentsDrawerProps) {
  const t = useTranslations('sales.history.drawer');
  const tHistory = useTranslations('sales.history');
  const tPrintDoc = useTranslations('common.printDoc');
  const locale = useLocale() as AppLocale;
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef || internalRef;
  const { user } = useAuthStore();

  // Drafts carry no payment/return/transaction history — hide those sections.
  const isDraft = sale?.status === 'draft';
  const returnsCount = saleReturns.length;
  const transactionsCount = transactions?.transactions?.length ?? 0;
  const refundedTotal = saleReturns.reduce(
    (sum, r) => sum + (r.totalRefundAmount ?? 0),
    0,
  );

  const showAddPayment =
    mode === 'summary' &&
    isAccountsEnabled &&
    !!sale &&
    sale.dueAmount > 0 &&
    sale.status !== 'cancelled';

  const showPaymentsFold = isLoadingPayments || payments.length > 0 || showAddPayment;
  const showReturnsFold = isLoadingReturns || returnsCount > 0;
  const showTransactionsFold = !!isLoadingTransactions || transactionsCount > 0;
  const emptySections = [
    ...(showPaymentsFold ? [] : [t('payments')]),
    ...(showReturnsFold ? [] : [t('returns')]),
    ...(showTransactionsFold ? [] : [t('transactions')]),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-[760px]">
        <SheetHeader>
          <SheetHeaderBar
            action={
              sale && (
                <div className="flex flex-wrap items-center gap-2">
                  <PrintMenu
                    appearance="solid"
                    a4Label={t('invoice')}
                    defaultPaper={resolveDefaultPaper(user?.organization)}
                    onPrint={(paper) =>
                      printSaleInvoice(sale, {
                        paper,
                        currency: formatCurrency,
                        header: orgToPrintHeader(user?.organization),
                        t: tPrintDoc,
                        locale,
                      })
                    }
                  />
                  <EmailReceiptButton sale={sale} />
                </div>
              )
            }
          >
            <SheetTitle className="flex flex-wrap items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              {mode === 'payment' ? t('recordPayment') : t('saleSummary')}
              {sale ? ` — ${sale.invoiceNumber}` : ''}
              {sale && <CopyField value={sale.invoiceNumber} showValue={false} />}
              {sale && (
                <Badge variant={statusConfig[sale.status]?.variant ?? 'outline'}>
                  {tHistory(`filters.${sale.status}`)}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {mode === 'payment' ? t('reviewAndPay') : t('fullDetails')}
            </SheetDescription>
          </SheetHeaderBar>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {sale && (
            <div className="mt-2 space-y-6 px-4 pb-6">
              {mode === 'payment' && (
                <PaymentEntryForm
                  sale={sale}
                  accounts={accounts}
                  isAccountsEnabled={isAccountsEnabled}
                  formatCurrency={formatCurrency}
                  paymentAmount={paymentAmount}
                  setPaymentAmount={setPaymentAmount}
                  paymentAccountId={paymentAccountId}
                  setPaymentAccountId={setPaymentAccountId}
                  paymentNotes={paymentNotes}
                  setPaymentNotes={setPaymentNotes}
                  useCreditBalance={useCreditBalance}
                  setUseCreditBalance={setUseCreditBalance}
                  isSubmittingPayment={isSubmittingPayment}
                  onCancel={() => onOpenChange(false)}
                  onSubmitPayment={onSubmitPayment}
                />
              )}

              <SaleStats sale={sale} saleReturns={saleReturns} />

              <SaleItemsTable sale={sale} />

              {sale.notes && <NoteCallout>{sale.notes}</NoteCallout>}

              {!isDraft && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t('history')}</div>

                  {showPaymentsFold && (
                    <SectionFold
                      title={t('payments')}
                      count={isLoadingPayments ? '…' : payments.length}
                      peek={t('received', { amount: formatCurrency(sale.paidAmount) })}
                      defaultOpen
                      action={
                        showAddPayment ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onMakePayment(sale);
                              if (scrollRef.current) scrollRef.current.scrollTop = 0;
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('addPayment')}
                          </Button>
                        ) : undefined
                      }
                    >
                      <PaymentHistoryList
                        sale={sale}
                        payments={payments}
                        isLoadingPayments={isLoadingPayments}
                        isAccountsEnabled={isAccountsEnabled}
                        mode={mode}
                        formatCurrency={formatCurrency}
                        onMakePayment={onMakePayment}
                        scrollRef={scrollRef}
                        bare
                      />
                    </SectionFold>
                  )}

                  {showReturnsFold && (
                    <SectionFold
                      title={t('returns')}
                      count={isLoadingReturns ? '…' : returnsCount}
                      peek={
                        refundedTotal > 0
                          ? `−${formatCurrency(refundedTotal)}`
                          : undefined
                      }
                    >
                      <ReturnsHistoryList
                        saleReturns={saleReturns}
                        isLoadingReturns={isLoadingReturns}
                        formatCurrency={formatCurrency}
                        bare
                      />
                    </SectionFold>
                  )}

                  {showTransactionsFold && (
                    <SectionFold
                      title={t('transactions')}
                      count={isLoadingTransactions ? '…' : transactionsCount}
                    >
                      <TransactionsTimeline
                        transactions={transactions}
                        isLoading={!!isLoadingTransactions}
                        formatCurrency={formatCurrency}
                        onNavigateToSale={onNavigateToSale}
                        bare
                      />
                    </SectionFold>
                  )}

                  <EmptySectionsLine sections={emptySections} />
                </div>
              )}

              <SaleDetailsKv sale={sale} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
