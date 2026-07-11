"use client";

import { useTranslations } from 'next-intl';
import { useMemo } from "react";
import {
  ReturnsHistoryList as SharedReturnsHistoryList,
  type NormalizedReturn,
} from "@/components/shared/returns";
import type { SalesReturn } from "@/types";
import { CopyableInvoice } from "./copyable-invoice";

interface ReturnsHistoryListProps {
  saleReturns: SalesReturn[];
  isLoadingReturns: boolean;
  formatCurrency: (n: number) => string;
  /** Content-only render for embedding inside a SectionFold. */
  bare?: boolean;
}

export function ReturnsHistoryList({
  saleReturns,
  isLoadingReturns,
  formatCurrency,
  bare,
}: ReturnsHistoryListProps) {
  const t = useTranslations('sales.history.returnsList');
  const normalized = useMemo<NormalizedReturn[]>(
    () =>
      saleReturns.map((ret) => ({
        _id: ret._id,
        returnNumber: ret.returnNumber,
        createdAt: ret.createdAt,
        status: ret.status,
        reason: ret.reason,
        totalRefundAmount: ret.totalRefundAmount,
        deductionAmount: ret.deductionAmount,
        notes: ret.notes,
        items: ret.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
          refundAmount: i.refundAmount,
        })),
        allocation: ret.refundAllocation
          ? {
              documentDueAdjustment:
                (ret.refundAllocation.adjustSaleDue ?? 0) > 0
                  ? {
                      label: t('adjustedAgainstSaleDue'),
                      amount: ret.refundAllocation.adjustSaleDue!,
                    }
                  : undefined,
              otherDueAdjustments: ret.refundAllocation.adjustOtherDues?.map((d) => ({
                label: t('adjustedAgainst'),
                amount: d.amount,
                reference: d.invoiceNumber ? (
                  <CopyableInvoice value={d.invoiceNumber} />
                ) : (
                  t('otherDue')
                ),
              })),
              accountRefund: ret.refundAllocation.accountRefund
                ? {
                    amount: ret.refundAllocation.accountRefund.amount,
                    paymentMethod: ret.refundAllocation.accountRefund.paymentMethod,
                  }
                : undefined,
              counterpartyCredit:
                (ret.refundAllocation.customerCredit?.amount ?? 0) > 0
                  ? {
                      label: t('convertedToStoreCredit'),
                      amount: ret.refundAllocation.customerCredit!.amount,
                    }
                  : undefined,
            }
          : undefined,
      })),
    [saleReturns, t],
  );

  return (
    <SharedReturnsHistoryList
      returns={normalized}
      isLoading={isLoadingReturns}
      formatCurrency={formatCurrency}
      emptyMessage={t('noReturns')}
      bare={bare}
    />
  );
}
