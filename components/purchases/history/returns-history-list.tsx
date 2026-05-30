"use client";

import { useMemo } from "react";
import {
  ReturnsHistoryList as SharedReturnsHistoryList,
  type NormalizedReturn,
} from "@/components/shared/returns";
import type { PurchaseReturn } from "@/types";

interface ReturnsHistoryListProps {
  purchaseReturns: PurchaseReturn[];
  isLoadingReturns: boolean;
  formatCurrency: (n: number) => string;
}

export function ReturnsHistoryList({
  purchaseReturns,
  isLoadingReturns,
  formatCurrency,
}: ReturnsHistoryListProps) {
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
          discount: i.discount,
          refundAmount: i.refundAmount,
        })),
        allocation: ret.refundAllocation
          ? {
              documentDueAdjustment:
                (ret.refundAllocation.adjustPurchaseDue ?? 0) > 0
                  ? {
                      label: "Adjusted against order due",
                      amount: ret.refundAllocation.adjustPurchaseDue!,
                    }
                  : undefined,
              otherDueAdjustments: ret.refundAllocation.adjustOtherDues?.map((d) => ({
                label: "Adjusted against other due",
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
                      label: "Adjusted to supplier credit",
                      amount: ret.refundAllocation.supplierCredit!.amount,
                    }
                  : undefined,
            }
          : undefined,
      })),
    [purchaseReturns],
  );

  return (
    <SharedReturnsHistoryList
      returns={normalized}
      isLoading={isLoadingReturns}
      formatCurrency={formatCurrency}
      emptyMessage="No returns for this purchase"
    />
  );
}
