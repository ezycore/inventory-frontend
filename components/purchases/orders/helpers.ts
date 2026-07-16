import type { PurchaseOrder, ReceivePurchaseOrderDto } from "@/types";
import type { ItemReceiveState } from "./types";

export const getRemainingQuantity = (
  quantity: number,
  receivedQuantity?: number,
): number => {
  const remaining = quantity - (receivedQuantity ?? 0);
  return Math.max(0, remaining);
};

export const buildReceiveItemsFromOrder = (
  order: PurchaseOrder,
): ItemReceiveState[] =>
  order.items.map((item) => {
    const maxQuantity = getRemainingQuantity(item.quantity, item.receivedQuantity);

    return {
      productId: item.productId,
      variantId: item.variantId,
      inventoryId: item.inventoryId,
      receivedQuantity: maxQuantity,
      maxQuantity,
      productName: item.productName || "Unknown Product",
    };
  });

export const clampReceiveQuantity = (
  quantity: number,
  maxQuantity: number,
): number => Math.min(Math.max(0, quantity), maxQuantity);

export const hasAnyReceivableItems = (items: ItemReceiveState[]): boolean =>
  items.some((item) => item.receivedQuantity > 0);

export const buildReceivePayload = (
  items: ItemReceiveState[],
): ReceivePurchaseOrderDto => ({
  items: items
    .filter((item) => item.receivedQuantity > 0)
    .map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      inventoryId: item.inventoryId,
      receivedQuantity: item.receivedQuantity,
    })),
});
