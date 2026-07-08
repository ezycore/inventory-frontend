'use client';
// coding-standard: maintained

import { CreditCard, ReceiptText } from 'lucide-react';
import { useRef } from 'react';
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
  Account,
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
  accounts: Account[];
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
      <SheetContent className="w-[760px] sm:max-w-[760px] flex flex-col">
        <SheetHeader>
          <SheetHeaderBar
            action={
              order && (
                <PrintMenu
                  appearance="solid"
                  a4Label="Purchase Order"
                  defaultPaper={resolveDefaultPaper(user?.organization)}
                  onPrint={(paper) =>
                    printPurchaseOrder(order, {
                      paper,
                      currency: formatCurrency,
                      header: orgToPrintHeader(user?.organization),
                    })
                  }
                />
              )
            }
          >
            <SheetTitle className="flex flex-wrap items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              {mode === 'payment' ? 'Record Payment' : 'Purchase Summary'}
              {order ? ` — ${order.orderNumber}` : ''}
              {order && <CopyField value={order.orderNumber} showValue={false} />}
              {order && (
                <Badge
                  variant={status?.variant ?? 'outline'}
                  className="flex w-fit gap-1"
                >
                  {status?.icon}
                  {status?.label ?? order.status}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {mode === 'payment'
                ? 'Review the purchase order and submit a payment'
                : 'Full purchase details and payment history'}
            </SheetDescription>
          </SheetHeaderBar>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {order && (
            <div className="mt-6 space-y-6 px-2">
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
                <div className="text-sm font-medium">History</div>

                {showPaymentsFold && (
                  <SectionFold
                    title="Payments"
                    count={isLoadingPayments ? '…' : payments.length}
                    peek={`${formatCurrency(order.paidAmount ?? 0)} paid`}
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
                          Add Payment
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
                    title="Returns"
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
                    title="Transactions"
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
