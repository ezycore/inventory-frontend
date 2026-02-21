/**
 * Discount Calculation Utility
 * Reusable functions for calculating discounts across the application
 */

export type DiscountType = "percentage" | "fixed";

export interface DiscountParams {
  /** Base price to apply discount to */
  price: number;
  /** Type of discount - percentage or fixed amount */
  discountType: DiscountType;
  /** Discount value (percentage amount or fixed amount) */
  discountValue: number;
}

export interface DiscountResult {
  /** Calculated discount amount */
  discountAmount: number;
  /** Final price after discount */
  salePrice: number;
}

/**
 * Calculate discount amount based on type and value
 *
 * Rules:
 * - If discountType === "percentage": discount = (price * discountValue) / 100
 * - If discountType === "fixed": discount = discountValue
 * - Discount must not exceed price
 * - Negative discount is not allowed
 * - Always returns a valid number
 *
 * @param params - Discount calculation parameters
 * @returns Calculated discount amount
 */
export function calculateDiscount({
  price,
  discountType,
  discountValue,
}: DiscountParams): number {
  // Validate inputs
  if (typeof price !== "number" || isNaN(price) || price < 0) {
    return 0;
  }
  if (
    typeof discountValue !== "number" ||
    isNaN(discountValue) ||
    discountValue < 0
  ) {
    return 0;
  }

  let discount: number;

  if (discountType === "percentage") {
    // Percentage discount: limit to 100%
    const clampedValue = Math.min(discountValue, 100);
    discount = (price * clampedValue) / 100;
  } else {
    // Fixed discount
    discount = discountValue;
  }

  // Ensure discount doesn't exceed price
  discount = Math.min(discount, price);

  // Round to 2 decimal places
  return Math.round(discount * 100) / 100;
}

/**
 * Calculate both discount amount and final sale price
 *
 * @param params - Discount calculation parameters
 * @returns Object containing discountAmount and salePrice
 */
export function calculateDiscountWithPrice(params: DiscountParams): DiscountResult {
  const discountAmount = calculateDiscount(params);
  const salePrice = Math.round((params.price - discountAmount) * 100) / 100;

  return {
    discountAmount,
    salePrice: Math.max(salePrice, 0), // Ensure non-negative
  };
}

export interface ApplyDiscountParams {
  /** Unit price of the product */
  price: number;
  /** Order-level discount type (fallback) */
  orderDiscountType?: DiscountType;
  /** Order-level discount value (fallback) */
  orderDiscountValue?: number;
}

/**
 * Apply discount with priority: product-level > order-level
 *
 * Rules:
 * - Product-level discount has higher priority
 * - use order-level (customer) discount
 *
 * @param params - Apply discount parameters with priority
 * @returns Discount calculation result
 */
export function applyDiscountWithPriority({
  price,
  orderDiscountType,
  orderDiscountValue,
}: ApplyDiscountParams): DiscountResult {
  // Determine which discount to apply
  const discountType = orderDiscountType ?? "fixed";
  const discountValue = orderDiscountValue ?? 0;
  return calculateDiscountWithPrice({
    price,
    discountType,
    discountValue,
  });
}

/**
 * Calculate total discount for a line item
 *
 * @param quantity - Number of items
 * @param unitPrice - Price per item
 * @param discountType - Type of discount
 * @param discountValue - Discount value
 * @returns Total discount amount for the line
 */
export function calculateLineDiscount(
  quantity: number,
  unitPrice: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const lineTotal = quantity * unitPrice;
  return calculateDiscount({
    price: lineTotal,
    discountType,
    discountValue,
  });
}

/**
 * Calculate line total after discount
 *
 * @param quantity - Number of items
 * @param unitPrice - Price per item
 * @param discountType - Type of discount
 * @param discountValue - Discount value
 * @returns Line total after discount
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const lineTotal = quantity * unitPrice;
  const discount = calculateLineDiscount(
    quantity,
    unitPrice,
    discountType,
    discountValue,
  );
  return Math.round((lineTotal - discount) * 100) / 100;
}
