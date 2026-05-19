"use client";

import type { PurchaseReturn } from "@/types";
import {
  ReturnDetailsSheet as SharedReturnDetailsSheet,
  type ReturnDetailsData,
} from "@/components/shared/returns/return-details-sheet";

function normalizePurchaseReturn(r: PurchaseReturn): ReturnDetailsData {
  const documentRef =
    typeof r.purchaseOrderId === "object" && r.purchaseOrderId?.orderNumber
      ? r.purchaseOrderId.orderNumber
      : r.orderNumber ?? "—";

  const counterpartyName =
    typeof r.supplierId === 'object' && r.supplierId !== null
      ? r.supplierId.name
      : r.supplier?.name ?? null;

  return {
    returnNumber: r.returnNumber,
    status: r.status,
    documentRef,
    counterpartyName,
    date: typeof (r.returnDate ?? r.createdAt) === 'string'
      ? (r.returnDate ?? r.createdAt) as string
      : new Date(r.returnDate ?? r.createdAt).toISOString(),
    reason: r.reason,
    totalRefundAmount: r.totalRefundAmount ?? 0,
    deductionAmount: r.deductionAmount,
    refundedAmount: r.refundedAmount,
    totalCostAmount: r.totalCostAmount,
    notes: r.notes,
    items: r.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      costPrice: item.costPrice,
      discount: item.discount,
      conversionFactor: item.conversionFactor,
      refundAmount: item.refundAmount,
    })),
    refundAllocation: r.refundAllocation
      ? {
          adjustDocumentDue: r.refundAllocation.adjustPurchaseDue,
          adjustOtherDues: r.refundAllocation.adjustOtherDues,
          accountRefund: r.refundAllocation.accountRefund,
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
