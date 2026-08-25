'use client';
// coding-standard: maintained

import { CreditCard, ReceiptText } from 'lucide-react';
import { useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
  printPurchaseOrder,
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
  AccountPaymentOption,
  PurchaseOrder,
  PurchaseReturn,
  PurchaseTransactionsResponse,
} from '@/types';
import { statusConfig } from '../status-config';
import { PaymentEntryForm } from './payment-entry-form';
import { PaymentHistoryList } from './payment-history-list';
import {
  PurchaseDetailsKv,
  PurchaseItemsTable,
  PurchaseStats,
} from './purchase-details-block';
import { ReturnsHistoryList } from './returns-history-list';
import { TransactionsTimeline } from './transactions-timeline';
import type { Payment } from './types';

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PurchaseOrder | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  mode: 'summary' | 'payment';
  accounts: AccountPaymentOption[];
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  isSubmittingPayment: boolean;
  onMakePayment: (order: PurchaseOrder) => void;
  onSubmitPayment: () => void;
  drawerRef?: React.RefObject<HTMLDivElement | null>;
  purchaseReturns: PurchaseReturn[];
  isLoadingReturns: boolean;
  transactions?: PurchaseTransactionsResponse;
  isLoadingTransactions?: boolean;
  onNavigateToPurchaseOrder?: (purchaseOrderId: string) => void;
  useSupplierCredit?: boolean;
  setUseSupplierCredit?: (v: boolean) => void;
}

export function PaymentsDrawer({
  open,
  onOpenChange,
  selectedOrder: order,
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
  isSubmittingPayment,
  onMakePayment,
  onSubmitPayment,
  drawerRef: externalRef,
  purchaseReturns,
  isLoadingReturns,
  transactions,
  isLoadingTransactions = false,
  onNavigateToPurchaseOrder,
  useSupplierCredit = false,
  setUseSupplierCredit,
}: PaymentsDrawerProps) {
  const t = useTranslations('purchases.history');
  const tStatus = useTranslations('purchases.status');
  const tOrders = useTranslations('purchases.orders');
  const tPrintDoc = useTranslations('common.printDoc');
  const locale = useLocale() as AppLocale;
  const internalRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = externalRef || internalRef;
  const { user } = useAuthStore();

  const returnsCount = purchaseReturns.length;
  const transactionsCount = transactions?.transactions?.length ?? 0;
  const refundedTotal = purchaseReturns.reduce(
    (sum, ret) => sum + (ret.totalRefundAmount ?? 0),
    0,
  );

  const showAddPayment =
    mode === 'summary' &&
    isAccountsEnabled &&
    !!order &&
    (order.dueAmount ?? 0) > 0 &&
    order.status !== 'cancelled';

  const showPaymentsFold = isLoadingPayments || payments.length > 0 || showAddPayment;
  const showReturnsFold = isLoadingReturns || returnsCount > 0;
  const showTransactionsFold = isLoadingTransactions || transactionsCount > 0;
  const emptySections = [
    ...(showPaymentsFold ? [] : ['Payments']),
    ...(showReturnsFold ? [] : ['Returns']),
    ...(showTransactionsFold ? [] : ['Transactions']),
  ];

  const status = order ? statusConfig[order.status] : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-[760px]">
        <SheetHeader>
          <SheetHeaderBar
            action={
              order && (
                <PrintMenu
                  appearance="solid"
                  a4Label={tOrders('printA4Label')}
                  defaultPaper={resolveDefaultPaper(user?.organization)}
                  onPrint={(paper) =>
                    printPurchaseOrder(order, {
                      paper,
                      currency: formatCurrency,
                      header: orgToPrintHeader(user?.organization),
                      t: tPrintDoc,
                      locale,
                    })
                  }
                />
              )
            }
          >
            <SheetTitle className="flex flex-wrap items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              {mode === 'payment' ? t('recordPayment') : t('purchaseSummary')}
              {order ? ` — ${order.orderNumber}` : ''}
              {order && <CopyField value={order.orderNumber} showValue={false} />}
              {order && (
                <Badge
                  variant={status?.variant ?? 'outline'}
                  className="flex w-fit gap-1"
                >
                  {status?.icon}
                  {order.status ? tStatus(order.status) : order.status}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {mode === 'payment'
                ? t('drawerPaymentDesc')
                : t('drawerSummaryDesc')}
            </SheetDescription>
          </SheetHeaderBar>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {order && (
            <div className="mt-2 space-y-6 px-4 pb-6">
              {mode === 'payment' && setUseSupplierCredit && (
                <PaymentEntryForm
                  order={order}
                  accounts={accounts}
                  isAccountsEnabled={isAccountsEnabled}
                  formatCurrency={formatCurrency}
                  paymentAmount={paymentAmount}
                  setPaymentAmount={setPaymentAmount}
                  paymentAccountId={paymentAccountId}
                  setPaymentAccountId={setPaymentAccountId}
                  paymentNotes={paymentNotes}
                  setPaymentNotes={setPaymentNotes}
                  useSupplierCredit={useSupplierCredit}
                  setUseSupplierCredit={setUseSupplierCredit}
                  isSubmittingPayment={isSubmittingPayment}
                  onCancel={() => onOpenChange(false)}
                  onSubmitPayment={onSubmitPayment}
                />
              )}

              <PurchaseStats order={order} purchaseReturns={purchaseReturns} />

              <PurchaseItemsTable order={order} />

              {order.notes && <NoteCallout>{order.notes}</NoteCallout>}

              <div className="space-y-2">
                <div className="text-sm font-medium">{t('historySection')}</div>

                {showPaymentsFold && (
                  <SectionFold
                    title={t('payments')}
                    count={isLoadingPayments ? '…' : payments.length}
                    peek={t('paidPeek', { amount: formatCurrency(order.paidAmount ?? 0) })}
                    defaultOpen
                    action={
                      showAddPayment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onMakePayment(order);
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
                      order={order}
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
                      refundedTotal > 0 ? `−${formatCurrency(refundedTotal)}` : undefined
                    }
                  >
                    <ReturnsHistoryList
                      purchaseReturns={purchaseReturns}
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
                      isLoading={isLoadingTransactions}
                      formatCurrency={formatCurrency}
                      onNavigateToPurchaseOrder={onNavigateToPurchaseOrder}
                      bare
                    />
                  </SectionFold>
                )}

                <EmptySectionsLine sections={emptySections} />
              </div>

              <PurchaseDetailsKv order={order} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
