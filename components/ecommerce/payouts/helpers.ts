// coding-standard: maintained
import type { CourierPayout } from "@/services/api";

/**
 * Shared vocabulary for the remittance screens.
 *
 * Nothing here computes money. `reconciled`, `residual` and `unrecordedGross` are the server's
 * own answers, derived from the clearing balances this app never sees — see
 * `docs/plan/cod-remittance-frontend.md` D9.
 */

/** Carrier names as the couriers write them, not as an enum reads. */
export const PROVIDER_LABELS: Record<string, string> = {
  pathao: "Pathao",
  steadfast: "Steadfast",
  ecourier: "eCourier",
};

export const providerLabel = (provider?: string | null): string =>
  provider ? (PROVIDER_LABELS[provider] ?? provider) : "Courier";

/**
 * The deduction kinds, in the order a merchant reads a statement.
 *
 * `paymentCharge` is deliberately its own line and never folded into `delivery`: it is the
 * disbursement fee (bKash's cut of the transfer), and adding a payment cost to shipping cost
 * makes delivery margin unreadable.
 */
export const DEDUCTION_KINDS = [
  { key: "delivery", label: "Delivery" },
  { key: "codFee", label: "COD fee" },
  { key: "returnCharge", label: "Return charge" },
  { key: "paymentCharge", label: "Payment charge" },
  { key: "adjustment", label: "Adjustment" },
] as const;

export type DeductionKind = (typeof DEDUCTION_KINDS)[number]["key"];

/** Only the deductions this statement actually carries — a zero line is noise. */
export const presentDeductions = (
  deductions: CourierPayout["deductions"] | undefined,
): { key: DeductionKind; label: string; amount: number }[] =>
  DEDUCTION_KINDS.map(({ key, label }) => ({
    key,
    label,
    amount: deductions?.[key] ?? 0,
  })).filter((row) => row.amount !== 0);

export const deductionsTotal = (
  deductions: CourierPayout["deductions"] | undefined,
): number =>
  DEDUCTION_KINDS.reduce((sum, { key }) => sum + (deductions?.[key] ?? 0), 0);

/**
 * A *preview* of the statement's own arithmetic for the record form — a hint beside the
 * merchant's typed net, never a substitute for it. The server re-derives this and refuses
 * `PAYOUT_UNRECONCILED`; this only lets the merchant see the mismatch before they submit.
 */
export const expectedNet = (
  gross: number,
  deductions: Partial<Record<DeductionKind, number>>,
): number => {
  const total = DEDUCTION_KINDS.reduce(
    (sum, { key }) => sum + (deductions[key] ?? 0),
    0,
  );
  return Math.round((gross - total) * 100) / 100;
};

/** A line the courier paid for but we never dispatched — normal, not an error. */
export const isUnmatchedLine = (line: CourierPayout["lines"][number]): boolean =>
  !line.orderId;
