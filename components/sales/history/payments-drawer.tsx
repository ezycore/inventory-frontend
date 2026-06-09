'use client';

import { ReceiptText } from 'lucide-react';
import { useRef } from 'react';
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
import { PaymentEntryForm } from './payment-entry-form';
import { PaymentHistoryList } from './payment-history-list';
import { ReturnsHistoryList } from './returns-history-list';
import { SaleDetailsBlock, SaleItemsList } from './sale-details-block';
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
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef || internalRef;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            {mode === 'payment' ? 'Record Payment' : 'Sale Summary'}
            {sale ? ` — ${sale.invoiceNumber}` : ''}
          </SheetTitle>
          <SheetDescription>
            {mode === 'payment'
              ? 'Review the sale and submit a payment'
              : 'Full sale details and payment history'}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {sale && (
            <div className="mt-6 space-y-6 px-2">
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

              <SaleDetailsBlock sale={sale} saleReturns={saleReturns} />

              <SaleItemsList sale={sale} />

              <ReturnsHistoryList
                saleReturns={saleReturns}
                isLoadingReturns={isLoadingReturns}
                formatCurrency={formatCurrency}
              />

              <TransactionsTimeline
                transactions={transactions}
                isLoading={!!isLoadingTransactions}
                formatCurrency={formatCurrency}
                onNavigateToSale={onNavigateToSale}
              />

              <PaymentHistoryList
                sale={sale}
                payments={payments}
                isLoadingPayments={isLoadingPayments}
                isAccountsEnabled={isAccountsEnabled}
                mode={mode}
                formatCurrency={formatCurrency}
                onMakePayment={onMakePayment}
                scrollRef={scrollRef}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
