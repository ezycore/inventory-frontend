"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ReturnsHistoryList as SharedReturnsHistoryList,
  type NormalizedReturn,
} from "@/components/shared/returns";
import type { PurchaseReturn } from "@/types";

interface ReturnsHistoryListProps {
  purchaseReturns: PurchaseReturn[];
  isLoadingReturns: boolean;
  formatCurrency: (n: number) => string;
  /** Content-only render for embedding inside a SectionFold. */
  bare?: boolean;
}

export function ReturnsHistoryList({
  purchaseReturns,
  isLoadingReturns,
  formatCurrency,
  bare,
}: ReturnsHistoryListProps) {
  const t = useTranslations("purchases.history");
  const normalized = useMemo<NormalizedReturn[]>(
    () =>
      purchaseReturns.map((ret) => ({
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
          refundAmount: i.refundAmount,
        })),
        allocation: ret.refundAllocation
          ? {
              documentDueAdjustment:
                (ret.refundAllocation.adjustPurchaseDue ?? 0) > 0
                  ? {
                      label: t("adjustedAgainstOrderDue"),
                      amount: ret.refundAllocation.adjustPurchaseDue!,
                    }
                  : undefined,
              otherDueAdjustments: ret.refundAllocation.adjustOtherDues?.map((d) => ({
                label: t("adjustedAgainstOtherDue"),
                amount: d.amount,
              })),
              accountRefund: ret.refundAllocation.accountRefund
                ? {
                    amount: ret.refundAllocation.accountRefund.amount,
                    paymentMethod: ret.refundAllocation.accountRefund.paymentMethod,
                  }
                : undefined,
              counterpartyCredit:
                (ret.refundAllocation.supplierCredit?.amount ?? 0) > 0
                  ? {
                      label: t("adjustedToSupplierCredit"),
                      amount: ret.refundAllocation.supplierCredit!.amount,
                    }
                  : undefined,
            }
          : undefined,
      })),
    [purchaseReturns, t],
  );

  return (
    <SharedReturnsHistoryList
      returns={normalized}
      isLoading={isLoadingReturns}
      formatCurrency={formatCurrency}
      emptyMessage={t("noReturnsForPurchase")}
      bare={bare}
    />
  );
}
