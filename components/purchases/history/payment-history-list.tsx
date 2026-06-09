"use client";

import { useMemo } from "react";
import {
  PaymentHistoryList as SharedPaymentHistoryList,
  type PaymentHistoryItem,
} from "@/components/shared/payments";
import type { PurchaseOrder } from "@/types";
import type { Payment } from "./types";

interface PaymentHistoryListProps {
  order: PurchaseOrder;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  mode: "summary" | "payment";
  formatCurrency: (n: number) => string;
  onMakePayment: (order: PurchaseOrder) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function PaymentHistoryList({
  order,
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
        accountName: (p as { accountId?: { name?: string } }).accountId?.name,
        notes: p.notes,
      })),
    [payments],
  );

  return (
    <SharedPaymentHistoryList
      doc={{ status: order.status, dueAmount: order.dueAmount ?? 0 }}
      payments={items}
      isLoading={isLoadingPayments}
      canAddPayment={isAccountsEnabled}
      isInPaymentMode={mode === "payment"}
      formatCurrency={formatCurrency}
      onAddPayment={() => {
        onMakePayment(order);
        if (scrollRef?.current) scrollRef.current.scrollTop = 0;
      }}
    />
  );
}
