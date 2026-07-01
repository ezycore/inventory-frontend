// coding-standard: maintained
"use client";

import { useState } from "react";
import type { PurchaseOrderItem } from "@/services/stores";
import { Input } from "@/ui/components/input";

/**
 * Inline per-line expiry/batch capture for instant purchases — mirrors the
 * order receive flow. Only rendered for expiry-tracked organizations on
 * "instant" sellers; the backend applies these only to expiry-tracked products.
 */
type CellProps = {
  item: PurchaseOrderItem;
  sellerId: string;
  onUpdate: (
    sellerId: string,
    itemId: string,
    data: Partial<Omit<PurchaseOrderItem, "id">>,
  ) => void;
};

export const ExpiryDateCell = ({ item, sellerId, onUpdate }: CellProps) => (
  <Input
    type="date"
    value={item.expiryDate ?? ""}
    onChange={(e) => onUpdate(sellerId, item.id, { expiryDate: e.target.value })}
    className="h-7 w-36 text-xs"
  />
);

export const BatchNumberCell = ({ item, sellerId, onUpdate }: CellProps) => {
  // Local state commits on blur so typing doesn't write to the persisted store
  // on every keystroke (and avoids controlled-input cursor jumps).
  const [value, setValue] = useState(item.batchNumber ?? "");

  // Resync local value when the persisted batch changes externally (render-phase
  // reset — avoids setState-in-effect cascading renders).
  const [prevBatch, setPrevBatch] = useState(item.batchNumber);
  if (item.batchNumber !== prevBatch) {
    setPrevBatch(item.batchNumber);
    setValue(item.batchNumber ?? "");
  }

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (item.batchNumber ?? "")) {
          onUpdate(sellerId, item.id, { batchNumber: value });
        }
      }}
      placeholder="optional"
      className="h-7 w-28 text-xs"
    />
  );
};
