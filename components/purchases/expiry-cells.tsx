// coding-standard: maintained
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PurchaseOrderItem } from "@/services/stores";
import { Input } from "@/ui/components/input";
import { DatePicker } from "@/ui/components/date-picker";

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

export const ExpiryDateCell = ({ item, sellerId, onUpdate }: CellProps) => {
  const t = useTranslations("purchases.items");
  return (
    <DatePicker
      date={item.expiryDate || undefined}
      onSelect={(d) => onUpdate(sellerId, item.id, { expiryDate: d ?? "" })}
      placeholder={t("expiryPlaceholder")}
      className="h-7 w-36 text-xs"
    />
  );
};

export const BatchNumberCell = ({ item, sellerId, onUpdate }: CellProps) => {
  const t = useTranslations("purchases.items");
  // Local state commits on blur so typing doesn't write to the persisted store
  // on every keystroke (and avoids controlled-input cursor jumps). When the
  // stored value changes externally, sync during render (not in an effect).
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
      placeholder={t("batchOptional")}
      className="h-7 w-28 text-xs"
    />
  );
};
