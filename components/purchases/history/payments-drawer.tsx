"use client";

import { ReceiptText } from "lucide-react";
import { useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import type {
  Account,
  PurchaseOrder,
  PurchaseReturn,
  PurchaseTransactionsResponse,
} from "@/types";
import { PaymentEntryForm } from "./payment-entry-form";
import { PaymentHistoryList } from "./payment-history-list";
import {
  PurchaseDetailsBlock,
  PurchaseItemsList,
} from "./purchase-details-block";
import { ReturnsHistoryList } from "./returns-history-list";
import { TransactionsTimeline } from "./transactions-timeline";
import type { Payment } from "./types";

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PurchaseOrder | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  mode: "summary" | "payment";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            {mode === "payment" ? "Record Payment" : "Purchase Summary"}
            {order ? ` — ${order.orderNumber}` : ""}
          </SheetTitle>
          <SheetDescription>
            {mode === "payment"
              ? "Review the purchase order and submit a payment"
              : "Full purchase details and payment history"}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {order && (
            <div className="mt-6 space-y-6 px-2">
              {mode === "payment" && setUseSupplierCredit && (
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

              <PurchaseDetailsBlock order={order} purchaseReturns={purchaseReturns} />
              <PurchaseItemsList order={order} />

              <ReturnsHistoryList
                purchaseReturns={purchaseReturns}
                isLoadingReturns={isLoadingReturns}
                formatCurrency={formatCurrency}
              />

              <TransactionsTimeline
                transactions={transactions}
                isLoading={isLoadingTransactions}
                formatCurrency={formatCurrency}
                onNavigateToPurchaseOrder={onNavigateToPurchaseOrder}
              />

              <PaymentHistoryList
                order={order}
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
