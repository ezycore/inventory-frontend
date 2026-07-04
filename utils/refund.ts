// coding-standard: maintained
/**
 * Refund basis (preview mirror of the backend).
 *
 * The backend is authoritative for the persisted refund (see
 * `easystock-backend/src/utils/refund-basis.ts`). This helper reproduces its
 * math bit-for-bit so the returns UI can show the correct refund live, before
 * submit, and so the FE-sent `refundAmount` matches what the server computes.
 *
 * Refund = what the customer actually paid for the returned units. Derived from
 * the stored line `subtotal` (NOT `price * quantity` — the persisted per-unit
 * price is rounded to 2dp and drifts for combo component lines whose true unit
 * price is `share / qtyPer`), with the order-level `additionalDiscount` spread
 * across ALL order lines proportionally to each line's subtotal, made
 * tax-inclusive (so exclusive-tax sales refund the tax too).
 */
import type { TaxType } from "@/types";
import { computeLineTax } from "@/utils/tax";

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface RefundBasisLine {
  /** Stored line subtotal (exact 2dp source of truth). */
  subtotal: number;
  /** Original sale line quantity. */
  quantity: number;
  taxRate?: number;
  taxType?: TaxType;
}

/**
 * Per-line refund basis for `returnQty` returned units. Bit-identical to the
 * backend `lineRefundBasis`.
 */
export function lineRefundBasis(
  line: RefundBasisLine,
  returnQty: number,
  orderSubtotal: number,
  additionalDiscount: number,
): number {
  const subtotal = round2(line.subtotal || 0);
  const saleQty = line.quantity || 1;
  const total = round2(orderSubtotal || 0);

  const disc = Math.min(Math.max(0, round2(additionalDiscount || 0)), total);
  const share = total > 0 ? subtotal / total : 0;
  const discountedNet = Math.max(0, round2(subtotal - disc * share));

  // computeLineTax(price=discountedNet, qty=1) → lineTotal is tax-inclusive:
  // inclusive returns discountedNet unchanged; exclusive adds round(net*rate/100).
  const fullLineRefund = computeLineTax({
    price: discountedNet,
    quantity: 1,
    discount: 0,
    taxRate: line.taxRate,
    taxType: line.taxType,
  }).lineTotal;

  return round2((fullLineRefund * returnQty) / saleQty);
}
