"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSellPageStore, type SellOrderItem } from "@/services/stores";
import { cn } from "@ui/lib/utils";
import { normalizeSerials } from "@/utils/serial";
import { SerialEntryDialog } from "./serial-entry-dialog";
import { useSerialKindOf } from "./use-serial-kinds";

/**
 * The cart line's "Serials 1/2" button and its entry dialog. Renders nothing
 * for a product that does not track serials. Amber while codes are missing,
 * red when the line holds more codes than units (quantity was lowered after).
 */
export function CartLineSerials({
  item,
  onChange,
}: {
  item: SellOrderItem;
  onChange: (serials: string[]) => void;
}) {
  const t = useTranslations("sales.serials");
  const kindOf = useSerialKindOf();
  const kind = kindOf(item);
  const items = useSellPageStore((s) => s.items);
  const [open, setOpen] = useState(false);
  const otherCodes = useMemo(
    () => items.filter((line) => line.id !== item.id).flatMap((line) => normalizeSerials(line.serials)),
    [items, item.id],
  );

  if (!kind) return null;
  const count = normalizeSerials(item.serials).length;
  const tooMany = count > item.quantity;
  const missing = count < item.quantity;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums",
          tooMany
            ? "border-destructive/50 text-destructive"
            : missing
              ? "border-amber-500/50 text-amber-700 dark:text-amber-400"
              : "border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
        )}
      >
        <ScanLine className="size-3.5" />
        {t(kind === "imei" ? "chipImei" : "chip", { count, total: item.quantity })}
      </button>
      <SerialEntryDialog
        open={open}
        onOpenChange={setOpen}
        productName={item.productName}
        kind={kind}
        quantity={Math.max(item.quantity, count)}
        value={normalizeSerials(item.serials)}
        otherCodes={otherCodes}
        onSave={(slots) => {
          onChange(slots.filter((slot) => slot.trim().length > 0));
          setOpen(false);
        }}
      />
    </>
  );
}
