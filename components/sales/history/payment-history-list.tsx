"use client";

import { useMemo } from "react";
import {
  PaymentHistoryList as SharedPaymentHistoryList,
  type PaymentHistoryItem,
} from "@/components/shared/payments";
import { useAuthStore } from "@/services/stores";
import { isFeatureEnabled } from "@/lib/feature-utils";
import {
  orgToPrintHeader,
  printPaymentReceipt,
  resolveDefaultPaper,
} from "@/utils/print-documents";
import type { Payment, Sale } from "@/types";

interface PaymentHistoryListProps {
  sale: Sale;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  mode: "summary" | "payment";
  formatCurrency: (n: number) => string;
  onMakePayment: (sale: Sale) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Content-only render for embedding inside a SectionFold. */
  bare?: boolean;
}

export function PaymentHistoryList({
  sale,
  payments,
  isLoadingPayments,
  isAccountsEnabled,
  mode,
  formatCurrency,
  onMakePayment,
  scrollRef,
  bare,
}: PaymentHistoryListProps) {
  const { user } = useAuthStore();
  const canPrint = isFeatureEnabled(
    user?.organization?.features,
    "invoicePrinting",
  );
  const items = useMemo<PaymentHistoryItem[]>(
    () =>
      payments.map((p) => ({
        _id: p._id,
        amount: p.amount,
        createdAt: p.createdAt,
        paymentMethod: p.paymentMethod,
        accountName: p.accountId?.name,
        notes: p.notes,
      })),
    [payments],
  );

  return (
    <SharedPaymentHistoryList
      doc={{ status: sale.status, dueAmount: sale.dueAmount }}
      payments={items}
      isLoading={isLoadingPayments}
      bare={bare}
      canAddPayment={isAccountsEnabled}
      isInPaymentMode={mode === "payment"}
      formatCurrency={formatCurrency}
      onAddPayment={() => {
        onMakePayment(sale);
        if (scrollRef?.current) scrollRef.current.scrollTop = 0;
      }}
      onPrintReceipt={
        canPrint
          ? (p) =>
              printPaymentReceipt(
                {
                  amount: p.amount,
                  createdAt: p.createdAt,
                  paymentMethod: p.paymentMethod,
                  accountName: p.accountName,
                  notes: p.notes,
                  docNumber: sale.invoiceNumber,
                  counterparty: sale.customerId?.name ?? "Walk-in Customer",
                  isSale: true,
                  balanceDue: sale.dueAmount,
                },
                {
                  paper: resolveDefaultPaper(user?.organization),
                  currency: formatCurrency,
                  header: orgToPrintHeader(user?.organization),
                },
              )
          : undefined
      }
    />
  );
}
