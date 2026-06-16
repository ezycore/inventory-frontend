import type { PurchaseOrderStatus } from "@/types";

export interface ItemReceiveState {
  productId: string;
  variantId?: string | null;
  inventoryId?: string;
  receivedQuantity: number;
  maxQuantity: number;
  productName: string;
  // Per-line expiry batch capture; only applied to expiry-tracked products on receive.
  expiryDate?: string;
  batchNumber?: string;
}
