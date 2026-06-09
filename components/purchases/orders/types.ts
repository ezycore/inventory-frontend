import type { PurchaseOrderStatus } from "@/types";

export interface ItemReceiveState {
  productId: string;
  variantId?: string | null;
  inventoryId?: string;
  receivedQuantity: number;
  maxQuantity: number;
  productName: string;
}
