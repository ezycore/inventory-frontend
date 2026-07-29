// coding-standard: maintained

import { useMemo, useState } from "react";
import type {
  CustomerOutstandingSale,
  CustomerPaymentAllocationInput,
} from "@/types";

/** Money comparisons tolerate sub-paisa float drift, same as the API. */
const EPSILON = 0.01;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Fill invoices oldest-first until the amount runs out — the same rule the
 * server applies, so the preview matches what a receipt will actually settle.
 */
function fillOldestFirst(
  sales: CustomerOutstandingSale[],
  amount: number,
): Record<string, number> {
  const allocations: Record<string, number> = {};
  let remaining = amount;

  for (const sale of sales) {
    if (remaining <= EPSILON) break;
    const take = round(Math.min(remaining, sale.dueAmount));
    if (take <= 0) continue;
    allocations[sale._id] = take;
    remaining = round(remaining - take);
  }

  return allocations;
}

/**
 * Allocation state for a customer receipt.
 *
 * Starts in auto mode (oldest-first, re-derived whenever the amount changes).
 * Touching any row switches to manual mode, where the caller's split is kept
 * as-is and sent to the server with `autoAllocate: false`.
 */
export function useBulkPaymentAllocation(
  sales: CustomerOutstandingSale[],
  amount: number,
) {
  const [manual, setManual] = useState<Record<string, number> | null>(null);

  const allocations = useMemo(
    () => manual ?? fillOldestFirst(sales, amount),
    [manual, sales, amount],
  );

  const allocatedTotal = useMemo(
    () => round(Object.values(allocations).reduce((sum, n) => sum + n, 0)),
    [allocations],
  );

  const changeAllocation = (saleId: string, next: number) => {
    const sale = sales.find((s) => s._id === saleId);
    const capped = round(Math.max(0, Math.min(next, sale?.dueAmount ?? next)));
    setManual({ ...allocations, [saleId]: capped });
  };

  /** Drop the manual split and go back to following the amount field. */
  const resetToAuto = () => setManual(null);

  const payload: CustomerPaymentAllocationInput[] = Object.entries(allocations)
    .filter(([, value]) => value > 0)
    .map(([saleId, value]) => ({ saleId, amount: value }));

  return {
    allocations,
    allocatedTotal,
    unallocated: round(amount - allocatedTotal),
    isManual: manual !== null,
    changeAllocation,
    resetToAuto,
    payload,
  };
}
