import type { SelectOption } from "@/ui/components/form/type";
import type {
  AccountApiResponse,
  ExtractedProduct,
  ExtractedSupplier,
  ProductApiResponse,
  SupplierApiResponse,
  SupplierFormData,
  ProductFormData,
} from "./types";

// =====================
// Transform Callbacks
// =====================

/**
 * Transform supplier API response to select options with discount metadata
 */
export const supplierItemsCreateCallback = (
  response: SupplierApiResponse,
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    defaultDiscountValue: item.defaultDiscount?.value ?? 0,
    defaultDiscountType: item.defaultDiscount?.type ?? "fixed",
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
    price: item.price,
    productId: item.productId,
    variantId: item.variantId,
    conversionFactor: item.conversionFactor ?? 1,
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
 * Extract supplier value from form data (handles both string and object formats)
 */
export const extractSupplierValue = (
  val: SupplierFormData["supplierId"],
): ExtractedSupplier => {
  if (!val) {
    return {
      value: null,
      label: null,
      defaultDiscountType: "fixed",
      defaultDiscountValue: 0,
    };
  }
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value,
      label: val.label,
      defaultDiscountType: (val as any).defaultDiscountType || "fixed",
      defaultDiscountValue: (val as any).defaultDiscountValue || 0,
    };
  }
  return {
    value: val as string,
    label: null,
    defaultDiscountType: "fixed",
    defaultDiscountValue: 0,
  };
};

/**
 * Extract product value from form data (handles both string and object formats)
 */
export const extractProductValue = (
  val: ProductFormData["productId"],
): ExtractedProduct | null => {
  if (!val) return null;
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value,
      label: val.label,
      price: (val as any).price ?? 0,
      conversionFactor: (val as any).conversionFactor ?? 1,
      productId: (val as any).productId ?? "",
      variantId: (val as any).variantId ?? null,
    };
  }
  return null;
};
