// coding-standard: maintained
import type { CourierParcel, CourierPayout } from "@/services/api";

/**
 * Shared vocabulary for the remittance screens.
 *
 * Nothing here decides money. `reconciled`, `residual`, `unrecordedGross` and a balance's
 * `shortfall` are the server's own answers, derived from the clearing balances this app never
 * sees — see `docs/plan/cod-remittance-frontend.md` D9. The payment form's expected/difference
 * figures are a preview; the server re-derives both.
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

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What the courier kept on one payment: the statement's deductions plus any extra charges. */
export const payoutCharges = (payout: CourierPayout): number =>
  round2(deductionsTotal(payout.deductions) + (payout.extraCharges ?? 0));

/**
 * Where a payment's shortfall stands. `open` is what is still owed; once a later payment or
 * a write-off has settled it, the payment reads as resolved rather than unreconciled.
 */
export const payoutShortfall = (
  payout: CourierPayout,
): { open: number; badge?: "Unreconciled" | "Recovered" | "Written off" } => {
  const open = round2(
    Math.max(0, payout.residual - (payout.residualSettled ?? 0)),
  );
  if (open > 0 || (!payout.reconciled && payout.residual <= 0)) {
    return { open, badge: payout.reconciled ? undefined : "Unreconciled" };
  }
  if (payout.residual <= 0) return { open };
  return {
    open,
    badge:
      (payout.residualWrittenOff ?? 0) >= payout.residual
        ? "Written off"
        : "Recovered",
  };
};

/**
 * The parcels a payment of `amount` most likely covers: open parcels **oldest first**, ticked
 * until their owed sum covers the amount (backend `courier-settlement-manual.md` §4.3 D). A
 * returned parcel's negative owed is ticked in its turn too — the courier deducts its charge
 * from the same payment. `parcels` must already be oldest first, as the balances endpoint
 * returns them. Only a starting point: the merchant can change every tick.
 */
export const autoTick = (
  parcels: CourierParcel[],
  amount: number,
): string[] => {
  const ticked: string[] = [];
  let covered = 0;
  for (const parcel of parcels) {
    if (covered >= amount - 0.005 && ticked.length) break;
    ticked.push(parcel.orderId);
    covered = round2(covered + parcel.owed);
  }
  return amount > 0 ? ticked : [];
};

/** What the ticked parcels should net: Σ(collected − charge). A preview of the server's figure. */
export const expectedFor = (
  parcels: CourierParcel[],
  ticked: string[],
): number => {
  const set = new Set(ticked);
  return round2(
    parcels.reduce((sum, p) => (set.has(p.orderId) ? sum + p.owed : sum), 0),
  );
};

/** Balance card key → the courier fields the payment and write-off endpoints take. */
export const courierParams = (balance: {
  provider?: string;
  customCourierId?: string;
}): {
  provider?: "pathao" | "steadfast" | "ecourier";
  customCourierId?: string;
} => ({
  ...(balance.provider
    ? { provider: balance.provider as "pathao" | "steadfast" | "ecourier" }
    : {}),
  ...(balance.customCourierId
    ? { customCourierId: balance.customCourierId }
    : {}),
});

/** A line the courier paid for but we never dispatched — normal, not an error. */
export const isUnmatchedLine = (
  line: CourierPayout["lines"][number],
): boolean => !line.orderId;
