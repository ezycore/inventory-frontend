import type { DiscountType } from "@/utils/discount";

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
}

export interface OrderPayment {
  paidAmount: number;
  accountId: string;
}

export interface CreateSalesOrderData {
  customerId?: string;
  locationId: string;
  items: OrderItem[];
  additionalDiscount: number;
  totalPrice: number;
  costPrice: number;
  notes?: string;
  payment?: OrderPayment;
  dueAmount?: number;
}
