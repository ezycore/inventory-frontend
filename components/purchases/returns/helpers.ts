import type { PurchaseOrder, PurchaseOrderItem } from "@/types";
import { computeLineTax } from "@/utils/tax";
import type { ReturnableItem, DueAllocation } from "./types";

/**
 * Tax-inclusive refund per purchase unit, derived per-line from the order line's
 * own `taxRate`/`taxType` (mirrors the sales-return path; reuses `computeLineTax`).
 * inclusive → cost as-is (tax already inside); exclusive → cost + that line's tax.
 */
function refundUnitPriceFor(item: PurchaseOrderItem): number {
  return computeLineTax({
    price: item.costPrice ?? item.price,
    quantity: 1,
    discount: 0,
    taxRate: item.taxRate,
    taxType: item.taxType,
  }).lineTotal;
}

/** Build initial returnable items from order */
export function buildReturnableItems(order: PurchaseOrder): ReturnableItem[] {
  if (!order.items) return [];
  return order.items.map((item) => ({
    ...item,
    maxReturnableQty: item.receivedQuantity || 0,
    returnQty: 0,
    refundAmount: 0,
    selected: false,
    refundUnitPrice: refundUnitPriceFor(item),
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

/** Refund amount for an item = qty × tax-inclusive per-unit refund (see `refundUnitPriceFor`). */
export function calculateItemRefund(qty: number, refundUnitPrice: number): number {
  return Math.round(qty * refundUnitPrice * 100) / 100;
}

/** Max refund for an item (same per-unit basis as the live refund). */
export function calculateMaxRefund(returnQty: number, refundUnitPrice: number): number {
  return calculateItemRefund(returnQty, refundUnitPrice);
}
