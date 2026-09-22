// coding-standard: maintained

/**
 * The period-on-period trend a report tile prints, or `null` when there is
 * nothing honest to print.
 *
 * **A previous period of zero is not 100% growth.** Four byte-identical copies of
 * this helper returned `{ value: 100, direction: "up" }` there, so a workspace
 * whose first month of trading is the period on screen read "↑ 100% vs previous
 * period" under every tile — a number with no basis, stated as fact. It surfaced
 * the moment the Orders Report was pointed at a real dataset whose prior month
 * was empty (2026-09-22).
 *
 * `null` is also the answer when nothing moved. A tile saying "0% vs previous
 * period" spends a line to say nothing; the callers already skipped rendering
 * that case, so returning `null` folds two checks into one.
 *
 * This matches what `profit-loss-report.tsx` had always done on its own — it was
 * the only copy that got the zero case right, and nobody propagated it.
 *
 * Reports are the caller here, not the dashboard: `components/dashboard/helpers.ts`
 * still carries its own copy with the old behaviour, because changing every KPI
 * tile on the home screen is a separate decision from fixing a report.
 */
export interface PeriodChange {
  /** Absolute percentage, already rounded. */
  value: number;
  direction: "up" | "down";
}

export function calcPeriodChange(
  current: number,
  previous: number,
): PeriodChange | null {
  // No basis to compare against — see the note above.
  if (previous === 0) return null;

  // `Math.abs` on the denominator so a negative prior period (a loss) still
  // yields a signed percentage the right way round.
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const value = Math.abs(Math.round(pct));

  // Rounds to nothing, or genuinely unchanged: no trend worth a line.
  if (value === 0) return null;

  return { value, direction: pct > 0 ? "up" : "down" };
}
