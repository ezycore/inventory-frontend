import type { PurchaseOrderItem, PurchaseReturnReason } from "@/types";

export interface ReturnableItem extends PurchaseOrderItem {
  maxReturnableQty: number;
  returnQty: number;
  refundAmount: number;
  selected: boolean;
}

export interface DueAllocation {
  dueId: string;
  purchaseOrderId: string;
  orderNumber: string;
  dueAmount: number;
  allocatedAmount: number;
  selected: boolean;
}

export const RETURN_REASONS: { value: PurchaseReturnReason; label: string }[] =
  [
    { value: "damaged", label: "Damaged" },
    { value: "defective", label: "Defective" },
    { value: "wrong_item", label: "Wrong Item" },
    { value: "excess_quantity", label: "Excess Quantity" },
    { value: "expired", label: "Expired" },
    { value: "other", label: "Other" },
  ];
