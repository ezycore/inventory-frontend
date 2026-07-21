// coding-standard: maintained

/**
 * What a registration change does to the month it lands in.
 *
 * A VAT period is one calendar month, so a change dated mid-month splits it:
 * documents before `effectiveFrom` keep the old treatment, documents from that
 * date on get the new one. The owner is entitled to see that before saving —
 * the entry is appended, never edited, and documents already issued are never
 * rewritten.
 */
export interface VatPeriodSplit {
  /** True when the date falls after the 1st, i.e. the month is split in two. */
  isMidPeriod: boolean;
  /** 1-based day the new registration takes effect. */
  effectiveDay: number;
  /** Last day of that month. */
  lastDay: number;
  /** e.g. "2026-07" — the affected period. */
  monthKey: string;
}

/** Days in the month containing `date` (UTC, matching how periods are keyed). */
const daysInMonth = (date: Date): number =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

/**
 * Describe the split a change on `effectiveFrom` would cause.
 *
 * Returns `isMidPeriod: false` for the 1st of a month — that is a clean period
 * boundary and needs no split warning, only the standard confirmation.
 */
export function describeVatPeriodSplit(
  effectiveFrom: string | Date,
): VatPeriodSplit {
  const date =
    typeof effectiveFrom === "string"
      ? // Parse as UTC so a yyyy-MM-dd string is not shifted by the local zone —
        // the same off-by-one the DatePicker's yyyy-MM-dd output exists to avoid.
        new Date(`${effectiveFrom.slice(0, 10)}T00:00:00Z`)
      : effectiveFrom;

  const effectiveDay = date.getUTCDate();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return {
    isMidPeriod: effectiveDay > 1,
    effectiveDay,
    lastDay: daysInMonth(date),
    monthKey: `${date.getUTCFullYear()}-${month}`,
  };
}
