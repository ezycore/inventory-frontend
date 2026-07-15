"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  PaymentHistoryList as SharedPaymentHistoryList,
  type PaymentHistoryItem,
} from "@/components/shared/payments";
import type { AppLocale } from "@/i18n/config";
import { useAuthStore } from "@/services/stores";
import { isFeatureEnabled } from "@/lib/feature-utils";
import {
  orgToPrintHeader,
  printPaymentReceipt,
  resolveDefaultPaper,
} from "@/utils/print-documents";
import type { PurchaseOrder } from "@/types";
import { populatedRef } from "@/utils/populated-ref";
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
  /** Content-only render for embedding inside a SectionFold. */
  bare?: boolean;
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
  bare,
}: PaymentHistoryListProps) {
  const tPrintDoc = useTranslations("common.printDoc");
  const locale = useLocale() as AppLocale;
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
      bare={bare}
      canAddPayment={isAccountsEnabled}
      isInPaymentMode={mode === "payment"}
      formatCurrency={formatCurrency}
      onAddPayment={() => {
        onMakePayment(order);
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
                  docNumber: order.orderNumber,
                  counterparty: populatedRef(order.supplierId)?.name ?? "-",
                  isSale: false,
                  balanceDue: order.dueAmount ?? 0,
                },
                {
                  paper: resolveDefaultPaper(user?.organization),
                  currency: formatCurrency,
                  header: orgToPrintHeader(user?.organization),
                  t: tPrintDoc,
                  locale,
                },
              )
          : undefined
      }
    />
  );
}
