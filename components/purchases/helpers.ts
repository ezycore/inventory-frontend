import type { ExtractedSupplier, SupplierFormData } from "./types";

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