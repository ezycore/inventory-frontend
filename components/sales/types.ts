import type { DiscountType } from "@/utils/discount";
import type { TaxType } from "@/types";

// =====================
// API Response Types
// =====================

export interface CustomerApiItem {
  _id: string;
  name: string;
  defaultDiscount?: {
    value?: number;
    type?: DiscountType;
  };
}

export interface ProductApiItem {
  _id: string; // inventoryId
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  productId: string;
  variantId: string | null;
  conversionFactor?: number;
  unitName?: string | null;
  saleUnitName?: string | null;
  purchaseUnitName?: string | null;
  quantityAlert: number;
  barcode?: string;
  hasExpiry?: boolean;
  taxRate?: number;
  taxType?: TaxType;
}

export interface AccountApiItem {
  _id: string;
  name: string;
  isDefault: boolean;
  balance: number;
}

export interface CustomerApiResponse {
  data?: {
    items?: CustomerApiItem[];
  };
}

export interface ProductApiResponse {
  data?: ProductApiItem[];
}

export interface AccountApiResponse {
  data?: {
    items?: AccountApiItem[];
  };
}
export interface ExtractedCustomer {
  value: string | null;
  label: string | null;
  discountType: DiscountType;
  discountValue: number;
}

export interface ExtractedProduct {
  value: string; // inventoryId
  label: string;
  price: number;
  costPrice: number;
  availableQuantity: number;
  productId: string;
  variantId: string | null;
  conversionFactor?: number;
  unitName?: string | null;
  saleUnitName?: string | null;
  purchaseUnitName?: string | null;
  quantityAlert: number;
  barcode?: string;
  hasExpiry?: boolean;
  taxRate?: number;
  taxType?: TaxType;
}
export interface OrderItem {
  productId: string;
  inventoryId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  productName: string;
  unitName?: string | null;
  saleUnitName?: string | null;
  /** Tax rate (percent) for the line, copied from the product. */
  taxRate?: number;
  /** "inclusive" = price already contains tax; "exclusive" = tax added on top. */
  taxType?: TaxType;
  /** Preview-computed tax amount for the line (UI only; backend is authoritative). */
  taxAmount?: number;
  /** Expiry-tracked product (drives the POS batch picker). UI-only. */
  hasExpiry?: boolean;
  /** Manual batch override for the line; omit/null = auto FEFO. Sent to the API. */
  batchId?: string | null;
}

export interface OrderPayment {
  paidAmount: number;
  accountId: string;
}

export interface CreateSalesOrderData {
  customerId?: string;
  items: OrderItem[];
  additionalDiscount: number;
  totalPrice: number;
  costPrice: number;
  notes?: string;
  payment?: OrderPayment;
  dueAmount?: number;
  /** Apply this much of customer's store-credit to the sale at creation time. */
  creditBalanceAmount?: number;
  /** When "draft", BE skips inventory / payment / credit side-effects. */
  status?: "draft";
}
