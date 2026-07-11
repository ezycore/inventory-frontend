"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  TransactionsTimeline as SharedTransactionsTimeline,
  type TimelineData,
  type Tone,
} from "@/components/shared/transactions";
import type {
  PurchaseTransactionEntry,
  PurchaseTransactionsResponse,
} from "@/types";

const KIND_META: Record<PurchaseTransactionEntry["kind"], { labelKey: string; tone: Tone }> = {
  payment: { labelKey: "kindCashPayment", tone: "out" },
  credit_balance_payment: { labelKey: "kindSupplierCreditApplied", tone: "out" },
  cash_refund: { labelKey: "kindCashRefundReceived", tone: "in" },
  credit_applied_self: { labelKey: "kindReturnCredit", tone: "neutral" },
  credit_applied_from_other: { labelKey: "kindCreditFromOtherPo", tone: "neutral" },
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
  const t = useTranslations("purchases.history");
  const data = useMemo<TimelineData | undefined>(() => {
    if (!transactions) return undefined;
    const s = transactions.summary;
    return {
      chips: [
        { label: t("chipCashPaid"), value: s.cashPaid, tone: "out" },
        { label: t("chipCreditPaid"), value: s.supplierCreditPaid, tone: "neutral" },
        { label: t("chipCashRefund"), value: s.cashRefunded, tone: "in" },
        { label: t("chipRefundCredit"), value: s.refundCreditApplied, tone: "neutral" },
        { label: t("chipNetPaid"), value: s.netPaid, tone: "out" },
        { label: t("chipDue"), value: s.dueAmount, tone: s.dueAmount > 0 ? "out" : "in" },
      ],
      entries: transactions.transactions.map((entry) => ({
        id: entry.id,
        label: t(KIND_META[entry.kind].labelKey as never),
        direction: entry.direction,
        amount: entry.amount,
        date: entry.date,
        accountName: entry.accountName,
        paymentMethod: entry.paymentMethod,
        reference: entry.reference ? { label: entry.reference.label } : undefined,
        notes: entry.notes,
        source: entry.sourcePurchase
          ? {
              prefix: t("fromPo"),
              label: entry.sourcePurchase.orderNumber,
              onClick: onNavigateToPurchaseOrder
                ? () => onNavigateToPurchaseOrder(entry.sourcePurchase!.id)
                : undefined,
            }
          : undefined,
      })),
    };
  }, [transactions, onNavigateToPurchaseOrder, t]);

  return (
    <SharedTransactionsTimeline
      data={data}
      isLoading={isLoading}
      formatCurrency={formatCurrency}
      bare={bare}
    />
  );
}
