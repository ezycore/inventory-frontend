import type { DiscountType } from "@/utils/discount";

// =====================
// API Response Types
// =====================

export interface SupplierApiItem {
  _id: string;
  name: string;
  defaultDiscount: {
    type: "percentage" | "fixed";
    value: number;
  };
}

export interface ProductApiItem {
  _id: string; // inventoryId
  name: string;
  price: number;
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

export interface SupplierApiResponse {
  data?: {
    items?: SupplierApiItem[];
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

// =====================
// Helper Return Types
// =====================

export interface ExtractedSupplier {
  value: string | null;
  label: string | null;
  defaultDiscountType: "percentage" | "fixed";
  defaultDiscountValue: number;
}

export interface ExtractedProduct {
  value: string; // inventoryId
  label: string;
  price: number;
  conversionFactor: number;
  productId: string;
  variantId: string | null;
}

// =====================
// Form Data Types
// =====================

export interface SupplierFormData {
  supplierId: string | { label: string; value: string } | null;
  purchaseType: "instant" | "order";
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export interface ProductFormData {
  productId: string | { label: string; value: string; price?: number; conversionFactor?: number; productId?: string; variantId?: string | null };
  quantity: number;
  convertedQuantity: number;
  price: number;
  discount: number;
  costPrice: number;
  rememberCostPrice?: boolean;
}

export interface PaymentFormData {
  accountId?: string | { label: string; value: string; isDefault?: boolean } | null;
  paidAmount?: number;
  notes?: string;
}
