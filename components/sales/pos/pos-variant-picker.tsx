"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import type { ExtractedProduct } from "@/components/sales/types";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { cn } from "@ui/lib/utils";
import { variantLabel, type PosProductGroup } from "./pos-catalog";

/**
 * Choose a size/variant of one product. Each tap adds one of that variant and
 * the dialog stays open, so "10 of size 7, 5 of size 7.5" is fifteen taps
 * without reopening anything.
 */
export function PosVariantPicker({
  group,
  inCartByRow,
  onAdd,
  onClose,
}: {
  group: PosProductGroup | null;
  inCartByRow: Map<string, number>;
  onAdd: (row: ExtractedProduct) => void;
  onClose: () => void;
}) {
  const t = useTranslations("sales.pos.browse");

  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{group?.name}</DialogTitle>
          <DialogDescription>{t("pickVariantHelp")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
          {group?.rows.map((row) => {
            const inCart = inCartByRow.get(row.value) ?? 0;
            return (
              <button
                key={row.value}
                type="button"
                onClick={() => onAdd(row)}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-lg border bg-card p-2 text-center transition-colors hover:border-primary",
                  inCart > 0 && "border-primary/60 bg-primary/5",
                )}
              >
                <span className="text-base font-bold leading-tight">{variantLabel(row, group.name)}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(row.price)}</span>
                {row.tracked !== false && (
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      row.availableQuantity <= 5 ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground",
                    )}
                  >
                    {t("inStock", { count: row.availableQuantity })}
                  </span>
                )}
                {inCart > 0 && (
                  <span className="text-[11px] font-bold text-primary">{t("inCart", { count: inCart })}</span>
                )}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
