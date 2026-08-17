// coding-standard: maintained

/**
 * One lot row from `GET /api/inventory/expiry/{expiring,expired}`.
 *
 * Shared by the report table and the write-off dialog, which is the second
 * reader — hence its own file rather than a copy in each.
 *
 * `costPrice` is per **base** unit, the same basis as `remainingQuantity`, so
 * the value of a lot is a plain multiply with no conversion factor (see the UOM
 * section of the backend's CLAUDE.md). `inventoryQuantity` is the on-hand total
 * across every lot of that product at that location — the write-off sends it as
 * `expectedQuantity`, so a report left open while stock moved is refused rather
 * than applied to a stale figure.
 */
export interface ExpiryBatchRow {
  _id: string;
  batchNumber?: string;
  expiryDate: string;
  remainingQuantity: number;
  costPrice?: number;
  inventoryQuantity?: number | null;
  variantId?: string | null;
  productId?: { _id?: string; name?: string } | null;
  locationId?: { _id?: string; name?: string } | null;
}

/** Σ cost value of a set of lots. Cost is per base unit — no conversion factor. */
export function lotValue(rows: ExpiryBatchRow[]): number {
  return rows.reduce(
    (sum, row) => sum + (row.costPrice ?? 0) * (row.remainingQuantity ?? 0),
    0,
  );
}
