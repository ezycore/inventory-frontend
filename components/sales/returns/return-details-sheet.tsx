'use client';

import type { SalesReturn } from '@/types';
import {
  ReturnDetailsSheet as SharedReturnDetailsSheet,
  type ReturnDetailsData,
} from '@/components/shared/returns/return-details-sheet';

function normalizeSalesReturn(r: SalesReturn): ReturnDetailsData {
  const documentRef =
    typeof r.saleId === 'object' && r.saleId?.invoiceNumber
      ? r.saleId.invoiceNumber
      : r.invoiceNumber ?? '—';

  const counterpartyName =
    typeof r.customerId === 'object' && r.customerId !== null
      ? r.customerId.name
      : null;

  return {
    returnNumber: r.returnNumber,
    status: r.status,
    documentRef,
    counterpartyName,
    date: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString(),
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
      price: item.price,
      costPrice: item.costPrice,
      discount: item.discount,
      refundAmount: item.refundAmount,
    })),
    refundAllocation: r.refundAllocation
      ? {
          adjustDocumentDue: r.refundAllocation.adjustSaleDue,
          adjustOtherDues: r.refundAllocation.adjustOtherDues?.map((d) => ({
            amount: d.amount,
            referenceLabel: d.invoiceNumber,
          })),
          accountRefund: r.refundAllocation.accountRefund,
          customerCredit: r.refundAllocation.customerCredit,
        }
      : undefined,
  };
}

interface ReturnDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReturn: SalesReturn | null;
  formatCurrency: (n: number) => string;
  isLoading?: boolean;
}

export function ReturnDetailsSheet({
  salesReturn,
  ...rest
}: ReturnDetailsSheetProps) {
  const returnData = salesReturn ? normalizeSalesReturn(salesReturn) : null;
  return (
    <SharedReturnDetailsSheet {...rest} returnData={returnData} variant="sales" />
  );
}
