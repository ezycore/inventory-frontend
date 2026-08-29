import type { PurchaseOrderItem, PurchaseReturnReason } from "@/types";

export interface ReturnableItem extends PurchaseOrderItem {
  maxReturnableQty: number;
  returnQty: number;
  refundAmount: number;
  selected: boolean;
  /** Tax-inclusive refund per purchase unit, derived per-line via `computeLineTax`. */
  refundUnitPrice: number;
  // FE-enriched display fields (the wire PO line carries only `productName`); the return page
  // attaches these from the product lookup for the returnable-items table.
  product?: { name: string };
  variantName?: string;
  discount?: number;
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
    { value: "quality_issue", label: "Quality Issue" },
    { value: "other", label: "Other" },
  ];
