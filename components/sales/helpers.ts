import type { SelectOption } from "@/ui/components/form/type";
import type { DiscountType } from "@/utils/discount";
import type {
  AccountApiResponse,
  CustomerApiResponse,
  ExtractedCustomer,
  ExtractedProduct,
  ProductApiResponse,
} from "./types";

// =====================
// Transform Callbacks
// =====================

/**
 * Transform customer API response to select options with discount metadata
 */
export const customerItemsCreateCallback = (
  response: CustomerApiResponse,
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    discountType: item.defaultDiscount?.value ?? 0,
    discountValue: item.defaultDiscount?.type ?? "fixed",
  })) as SelectOption[];
};

/**
 * Transform inventory API response to select options with pricing metadata
 */
export const productItemsCreateCallback = (
  response: ProductApiResponse,
): SelectOption[] => {
  const items = response?.data || [];
  return items.map((item) => ({
    value: item._id, // inventoryId
    label: item.name,
    costPrice: item.costPrice,
    unitPrice: item.price, // Match form field name
    availableQuantity: item.quantity,
    productId: item.productId,
    variantId: item.variantId,
  })) as SelectOption[];
};

/**
 * Transform accounts API response to select options
 */
export const accountItemsCreateCallback = (
  response: AccountApiResponse,
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: `${item.name} (৳${item.balance.toFixed(2)})`,
    isDefault: item.isDefault,
  })) as SelectOption[];
};

// =====================
// Helper Functions
// =====================


/**
 * Extract product value from form data
 */
export const extractProductValue = (val: any): ExtractedProduct | null => {
  if (!val) return null;
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value, // inventoryId
      label: val.label,
      price: val.price ?? 0,
      costPrice: val.costPrice ?? 0,
      availableQuantity: val.availableQuantity ?? 0,
      productId: (val as any).productId ?? "",
      variantId: (val as any).variantId ?? null,
    };
  }
  return null;
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;
