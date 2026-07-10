"use client";

import { useMemo } from "react";
import {
  TransactionsTimeline as SharedTransactionsTimeline,
  type TimelineData,
  type Tone,
} from "@/components/shared/transactions";
import type {
  PurchaseTransactionEntry,
  PurchaseTransactionsResponse,
} from "@/types";

const KIND_META: Record<PurchaseTransactionEntry["kind"], { label: string; tone: Tone }> = {
  payment: { label: "Cash payment", tone: "out" },
  credit_balance_payment: { label: "Supplier credit applied", tone: "out" },
  cash_refund: { label: "Cash refund received", tone: "in" },
  credit_applied_self: { label: "Return credit", tone: "neutral" },
  credit_applied_from_other: { label: "Credit from other PO", tone: "neutral" },
};

interface TransactionsTimelineProps {
  transactions?: PurchaseTransactionsResponse;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
  onNavigateToPurchaseOrder?: (purchaseOrderId: string) => void;
  /** Content-only render for embedding inside a SectionFold. */
  bare?: boolean;
}

export function TransactionsTimeline({
  transactions,
  isLoading,
  formatCurrency,
  onNavigateToPurchaseOrder,
  bare,
}: TransactionsTimelineProps) {
  const data = useMemo<TimelineData | undefined>(() => {
    if (!transactions) return undefined;
    const s = transactions.summary;
    return {
      chips: [
        { label: "Cash paid", value: s.cashPaid, tone: "out" },
        { label: "Credit paid", value: s.supplierCreditPaid, tone: "neutral" },
        { label: "Cash refund", value: s.cashRefunded, tone: "in" },
        { label: "Refund credit", value: s.refundCreditApplied, tone: "neutral" },
        { label: "Net paid", value: s.netPaid, tone: "out" },
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
        source: t.sourcePurchase
          ? {
              prefix: "From PO",
              label: t.sourcePurchase.orderNumber,
              onClick: onNavigateToPurchaseOrder
                ? () => onNavigateToPurchaseOrder(t.sourcePurchase!.id)
                : undefined,
            }
          : undefined,
      })),
    };
  }, [transactions, onNavigateToPurchaseOrder]);

  return (
    <SharedTransactionsTimeline
      data={data}
      isLoading={isLoading}
      formatCurrency={formatCurrency}
      bare={bare}
    />
  );
}
