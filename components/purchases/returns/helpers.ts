import type { PurchaseOrder } from "@/types";
import type { ReturnableItem, DueAllocation } from "./types";

/** Build initial returnable items from order */
export function buildReturnableItems(order: PurchaseOrder): ReturnableItem[] {
  if (!order.items) return [];
  // Order-level tax (manual lump) allocated proportionally to each line's value on refund.
  const subtotal =
    order.subtotal ||
    order.items.reduce(
      (s, i) => s + (i.receivedQuantity || i.quantity || 0) * (i.costPrice || i.price || 0),
      0,
    );
  const taxFactor = subtotal > 0 ? (order.taxTotal || 0) / subtotal : 0;
  return order.items.map((item) => ({
    ...item,
    maxReturnableQty: item.receivedQuantity || 0,
    returnQty: 0,
    refundAmount: 0,
    selected: false,
    taxFactor,
  }));
}

/** Build initial due allocations from pending dues */
export function buildDueAllocations(pendingDues: any[]): DueAllocation[] {
  if (pendingDues.length === 0) return [];
  return pendingDues.map((due: any) => ({
    dueId: due.id || due._id,
    purchaseOrderId: due.purchaseOrderId?._id ?? due.purchaseOrderId,
    orderNumber: due.orderNumber,
    dueAmount: due.currentAmount ?? due.dueAmount ?? 0,
    allocatedAmount: 0,
    selected: false,
  }));
}

/** Extract supplier ID from order (handles populated object or string) */
export function extractSupplierId(order: PurchaseOrder | undefined): string {
  if (!order) return "";
  if (typeof order.supplierId === "object" && order.supplierId?._id) {
    return order.supplierId._id;
  }
  if (typeof order.supplierId === "string") {
    return order.supplierId;
  }
  return order.supplierId?._id || "";
}

/** Calculate refund amount for an item (cost + proportional order tax). */
export function calculateItemRefund(
  qty: number,
  costPrice: number | undefined,
  price: number,
  taxFactor = 0,
): number {
  const pricePerUnit = (costPrice || price) * (1 + (taxFactor || 0));
  return Math.round(qty * pricePerUnit * 100) / 100;
}

/** Calculate max refund for an item */
export function calculateMaxRefund(
  returnQty: number,
  costPrice: number | undefined,
  price: number,
  taxFactor = 0,
): number {
  return calculateItemRefund(returnQty, costPrice, price, taxFactor);
}
