"use client";

import type { PurchaseReturn } from "@/types";
import {
  ReturnDetailsSheet as SharedReturnDetailsSheet,
  type ReturnDetailsData,
} from "@/components/shared/returns/return-details-sheet";
import { populatedRef } from "@/utils/populated-ref";

function normalizePurchaseReturn(r: PurchaseReturn): ReturnDetailsData {
  const documentRef =
    typeof r.purchaseOrderId === "object" && r.purchaseOrderId?.orderNumber
      ? r.purchaseOrderId.orderNumber
      : r.orderNumber ?? "—";

  const counterpartyName = populatedRef(r.supplierId)?.name ?? null;
  const alloc = r.refundAllocation;

  return {
    returnNumber: r.returnNumber,
    status: r.status,
    documentRef,
    counterpartyName,
    // The wire carries no separate `returnDate`; `createdAt` is when the return was recorded.
    date: r.createdAt,
    reason: r.reason,
    totalRefundAmount: r.totalRefundAmount ?? 0,
    deductionAmount: r.deductionAmount,
    refundedAmount: r.refundedAmount,
    notes: r.notes,
    items: r.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      costPrice: item.costPrice,
      conversionFactor: item.conversionFactor,
      refundAmount: item.refundAmount,
      taxRate: item.taxRate,
      taxType: item.taxType,
      taxAmount: item.taxAmount,
    })),
    refundAllocation: alloc
      ? {
          adjustDocumentDue: alloc.adjustPurchaseDue,
          adjustOtherDues: alloc.adjustOtherDues?.map((d) => ({
            amount: d.amount ?? 0,
            referenceLabel: d.orderNumber,
          })),
          accountRefund: alloc.accountRefund
            ? {
                amount: alloc.accountRefund.amount,
                paymentMethod: alloc.accountRefund.paymentMethod ?? "",
              }
            : undefined,
          counterpartyCredit: alloc.supplierCredit,
        }
      : undefined,
  };
}

interface ReturnDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseReturn: PurchaseReturn | null;
  formatCurrency: (n: number) => string;
  isLoading?: boolean;
}

export function ReturnDetailsSheet({
  purchaseReturn,
  ...rest
}: ReturnDetailsSheetProps) {
  const returnData = purchaseReturn ? normalizePurchaseReturn(purchaseReturn) : null;
  return (
    <SharedReturnDetailsSheet {...rest} returnData={returnData} variant="purchases" />
  );
}
