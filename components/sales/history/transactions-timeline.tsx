"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  TransactionsTimeline as SharedTransactionsTimeline,
  type TimelineData,
  type Tone,
} from "@/components/shared/transactions";
import type { SaleTransactionEntry, SaleTransactionsResponse } from "@/types";

// labelKey resolves under "sales.history.timeline" (docs/I18N.md)
const KIND_META: Record<SaleTransactionEntry["kind"], { labelKey: string; tone: Tone }> = {
  payment: { labelKey: "cashPayment", tone: "in" },
  credit_balance_payment: { labelKey: "storeCreditApplied", tone: "in" },
  cash_refund: { labelKey: "cashRefund", tone: "out" },
  credit_applied_self: { labelKey: "returnCredit", tone: "neutral" },
  credit_applied_from_other: { labelKey: "creditFromOtherSale", tone: "neutral" },
};

interface TransactionsTimelineProps {
  transactions?: SaleTransactionsResponse;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
  onNavigateToSale?: (saleId: string) => void;
  /** Content-only render for embedding inside a SectionFold. */
  bare?: boolean;
}

export function TransactionsTimeline({
  transactions,
  isLoading,
  formatCurrency,
  onNavigateToSale,
  bare,
}: TransactionsTimelineProps) {
  const tMsg = useTranslations("sales.history.timeline");
  const data = useMemo<TimelineData | undefined>(() => {
    if (!transactions) return undefined;
    const s = transactions.summary;
    return {
      chips: [
        { label: tMsg("cashPaid"), value: s.cashPaid, tone: "in" },
        { label: tMsg("creditPaid"), value: s.creditBalancePaid, tone: "neutral" },
        { label: tMsg("cashRefund"), value: s.cashRefunded, tone: "out" },
        { label: tMsg("refundCredit"), value: s.refundCreditApplied, tone: "neutral" },
        { label: tMsg("netReceived"), value: s.netReceived, tone: "in" },
        { label: tMsg("due"), value: s.dueAmount, tone: s.dueAmount > 0 ? "out" : "in" },
      ],
      entries: transactions.transactions.map((t) => ({
        id: t.id,
        label: tMsg(KIND_META[t.kind].labelKey),
        direction: t.direction,
        amount: t.amount,
        date: t.date,
        accountName: t.accountName,
        paymentMethod: t.paymentMethod,
        reference: t.reference ? { label: t.reference.label } : undefined,
        notes: t.notes,
        source: t.sourceSale
          ? {
              prefix: tMsg("fromSale"),
              label: t.sourceSale.invoiceNumber,
              onClick: onNavigateToSale ? () => onNavigateToSale(t.sourceSale!.id) : undefined,
            }
          : undefined,
      })),
    };
  }, [transactions, onNavigateToSale, tMsg]);

  return (
    <SharedTransactionsTimeline
      data={data}
      isLoading={isLoading}
      formatCurrency={formatCurrency}
      bare={bare}
    />
  );
}
