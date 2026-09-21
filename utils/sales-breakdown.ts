// coding-standard: maintained
import type { SalesBreakdownRow } from "@/services/api/modules/reports/api";

/** What the sales breakdown can be ranked by. Every one is a field on the row. */
export type BreakdownMetric = "revenue" | "units" | "orders";

export interface RankedRow {
  row: SalesBreakdownRow;
  /** 1-based position in the full ranking, so a lowest seller still says where it stands. */
  rank: number;
}

export interface BreakdownSplit {
  ranked: RankedRow[];
  top: RankedRow[];
  /** Lowest first. Never shares a row with `top`. */
  bottom: RankedRow[];
}

/**
 * Rank every group by one metric, then take the top and the bottom of that one list.
 *
 * With few groups the two halves would overlap — six categories and "top 5 / lowest 5" prints
 * four of them twice — so the top takes at most half (rounded up) and the bottom takes what is
 * left. Ties fall back to revenue, then name, so the order is stable between renders.
 */
export function splitBreakdown(
  rows: SalesBreakdownRow[],
  metric: BreakdownMetric,
  size = 5,
): BreakdownSplit {
  const ranked = [...rows]
    .sort(
      (a, b) =>
        b[metric] - a[metric] ||
        b.revenue - a.revenue ||
        (a.name ?? "").localeCompare(b.name ?? ""),
    )
    .map((row, i) => ({ row, rank: i + 1 }));

  const topCount = Math.min(size, Math.ceil(ranked.length / 2));
  const bottomCount = Math.min(size, ranked.length - topCount);

  return {
    ranked,
    top: ranked.slice(0, topCount),
    bottom: ranked.slice(ranked.length - bottomCount).reverse(),
  };
}
