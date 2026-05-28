"use client";

import { useMemo } from "react";
import {
  TransactionsTimeline as SharedTransactionsTimeline,
  type TimelineData,
  type Tone,
} from "@/components/shared/transactions";
import type { SaleTransactionEntry, SaleTransactionsResponse } from "@/types";

const KIND_META: Record<SaleTransactionEntry["kind"], { label: string; tone: Tone }> = {
  payment: { label: "Cash payment", tone: "in" },
  credit_balance_payment: { label: "Store credit applied", tone: "in" },
  cash_refund: { label: "Cash refund", tone: "out" },
  credit_applied_self: { label: "Return credit", tone: "neutral" },
  credit_applied_from_other: { label: "Credit from other sale", tone: "neutral" },
};

interface TransactionsTimelineProps {
  transactions?: SaleTransactionsResponse;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
  onNavigateToSale?: (saleId: string) => void;
}

export function TransactionsTimeline({
  transactions,
  isLoading,
  formatCurrency,
  onNavigateToSale,
}: TransactionsTimelineProps) {
  const data = useMemo<TimelineData | undefined>(() => {
    if (!transactions) return undefined;
    const s = transactions.summary;
    return {
      chips: [
        { label: "Cash paid", value: s.cashPaid, tone: "in" },
        { label: "Credit paid", value: s.creditBalancePaid, tone: "neutral" },
        { label: "Cash refund", value: s.cashRefunded, tone: "out" },
        { label: "Refund credit", value: s.refundCreditApplied, tone: "neutral" },
        { label: "Net received", value: s.netReceived, tone: "in" },
        { label: "Due", value: s.dueAmount, tone: s.dueAmount > 0 ? "out" : "in" },
      ],
      entries: transactions.transactions.map((t) => ({
        id: t.id,
        label: KIND_META[t.kind].label,
        direction: t.direction,
        amount: t.amount,
        date: t.date,
        accountName: t.accountName,
        paymentMethod: t.paymentMethod,
        reference: t.reference ? { label: t.reference.label } : undefined,
        notes: t.notes,
        source: t.sourceSale
          ? {
              prefix: "From sale",
              label: t.sourceSale.invoiceNumber,
              onClick: onNavigateToSale ? () => onNavigateToSale(t.sourceSale!.id) : undefined,
            }
          : undefined,
      })),
    };
  }, [transactions, onNavigateToSale]);

  return (
    <SharedTransactionsTimeline
      data={data}
      isLoading={isLoading}
      formatCurrency={formatCurrency}
    />
  );
}
