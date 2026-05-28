"use client";

import { useMemo } from "react";
import {
  PaymentHistoryList as SharedPaymentHistoryList,
  type PaymentHistoryItem,
} from "@/components/shared/payments";
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
}: PaymentHistoryListProps) {
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
      canAddPayment={isAccountsEnabled}
      isInPaymentMode={mode === "payment"}
      formatCurrency={formatCurrency}
      onAddPayment={() => {
        onMakePayment(sale);
        if (scrollRef?.current) scrollRef.current.scrollTop = 0;
      }}
    />
  );
}
