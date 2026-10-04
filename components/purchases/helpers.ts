// coding-standard: maintained
import { roundMoney } from "@/lib/money";

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
      defaultDiscountType: "percentage",
      defaultDiscountValue: 0,
    };
  }
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value,
      label: val.label,
      defaultDiscountType: (val as any).defaultDiscountType || "percentage",
      defaultDiscountValue: (val as any).defaultDiscountValue || 0,
    };
  }
  return {
    value: val as string,
    label: null,
    defaultDiscountType: "percentage",
    defaultDiscountValue: 0,
  };
};

/**
 * Derive a purchase line's 2-decimal pricing from the supplier discount settings.
 *
 * Cost price is rounded FIRST and the discount is back-derived from it, so that
 * `price - discount === costPrice` exactly and the line total shown here matches
 * what the API stores (`PurchaseUtils` persists `roundMoney(costPrice)` and
 * derives the subtotal from it). Rounding the raw percentage discount instead
 * leaves an unrounded cost price and the preview drifts off the saved order —
 * e.g. price 686 @ 14.25% showed ৳2,941.23 while the API stored ৳2,941.25.
 *
 * Both the manual add-product form and the low-stock import must call this.
 */
export const deriveLinePricing = (
  price: number,
  discountType: "percentage" | "fixed",
  discountValue: number,
): { price: number; discount: number; costPrice: number } => {
  const linePrice = roundMoney(price);
  const rawDiscount =
    discountType === "percentage"
      ? (linePrice * discountValue) / 100
      : discountValue;
  const costPrice = roundMoney(Math.max(0, linePrice - rawDiscount));
  return {
    price: linePrice,
    discount: roundMoney(linePrice - costPrice),
    costPrice,
  };
};

/**
 * Discount after the user edits a line's Price (MRP). Cost is what the merchant
 * actually pays, so it stays; the discount is re-derived as price − cost.
 */
export const discountForEditedPrice = (price: number, costPrice: number): number =>
  roundMoney(Math.max(0, price - costPrice));

/**
 * Whether a line's Price should be written back as the product's MRP
 * (`updateMrp` on the API). True when it differs from `mrpBoxPrice` — the price
 * the line started from. A zero price is never an MRP; it is a cleared field.
 */
export const isMrpEdited = (linePrice: number, mrpBoxPrice: number): boolean =>
  linePrice > 0 && roundMoney(linePrice) !== roundMoney(mrpBoxPrice);

/** Per-base-unit MRP for a pack-priced line — what `updateMrp` will store. */
export const mrpPerBaseUnit = (boxPrice: number, conversionFactor: number): number =>
  roundMoney(boxPrice / (conversionFactor > 0 ? conversionFactor : 1));
