"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { useFormatters } from "@/hooks/use-formatters";
import { useSaleSerials, useUpdateSaleSerials } from "@/services/api";
import type { Sale } from "@/types";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { normalizeSerials } from "@/utils/serial";
import { SaleLineSerials } from "./sale-line-serials";
import { SerialEntryDialog } from "./serial-entry-dialog";
import { useSerialKindOf, useSerialsEnabled } from "./use-serial-kinds";

/**
 * "Add / edit serials" on a posted sale — for an online order (no counter to
 * scan at), a combo's component, or a code the cashier skipped. Managers only
 * (`sales.edit`, decision 3 of `docs/plan/sale-serials.md`). Each save replaces
 * one line's codes; the server logs the change, shown here under the line.
 */
export function SaleSerialsEditor({ sale }: { sale: Sale }) {
  const t = useTranslations("sales.serials");
  const { formatDateTime } = useFormatters();
  const enabled = useSerialsEnabled();
  const canEdit = useHasPermission(PERMISSIONS.salesEdit);
  const kindOf = useSerialKindOf();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const { data: serialView } = useSaleSerials(sale._id, open);
  const update = useUpdateSaleSerials();

  const lines = useMemo(
    () =>
      sale.items
        .map((item, lineIndex) => {
          const live = serialView?.lines[lineIndex];
          return {
            lineIndex,
            name: item.productName,
            quantity: item.quantity,
            kind: kindOf({ inventoryId: String(item.inventoryId) }),
            serials: live?.serials ?? item.serials ?? [],
            history: live?.serialHistory ?? [],
          };
        })
        .filter((line) => line.kind || line.serials.length > 0),
    [sale.items, serialView, kindOf],
  );

  const posted = sale.status !== "draft" && sale.status !== "cancelled";
  if (!enabled || !canEdit || !posted || lines.length === 0) return null;

  const current = lines.find((line) => line.lineIndex === editing);
  const otherCodes = lines
    .filter((line) => line.lineIndex !== editing)
    .flatMap((line) => line.serials);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ScanLine className="size-4" />
        {t("edit")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editTitle", { invoice: sale.invoiceNumber })}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>
          <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-lg border">
            {lines.map((line) => {
              const missing = line.quantity - normalizeSerials(line.serials).length;
              return (
                <li key={line.lineIndex} className="space-y-1.5 p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{line.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("units", { count: line.quantity })}
                        {missing > 0 && (
                          <span className="ml-1.5 text-amber-700 dark:text-amber-400">
                            · {t("missing", { count: missing })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(line.lineIndex)}>
                      {t("editLine")}
                    </Button>
                  </div>
                  <SaleLineSerials serials={line.serials} />
                  {line.history.length > 0 && (
                    <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                      {[...line.history].reverse().map((entry, i) => (
                        <li key={`${String(entry.at)}-${i}`}>
                          {t("historyEntry", {
                            date: formatDateTime(entry.at),
                            before: entry.before.join(", ") || "—",
                            after: entry.after.join(", ") || "—",
                          })}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      {current && (
        <SerialEntryDialog
          open={editing !== null}
          onOpenChange={(next) => !next && setEditing(null)}
          productName={current.name}
          kind={current.kind}
          quantity={Math.max(current.quantity, current.serials.length)}
          value={current.serials}
          otherCodes={otherCodes}
          excludeSaleId={sale._id}
          saving={update.isPending}
          onSave={(slots) =>
            update.mutate(
              {
                saleId: sale._id,
                lines: [
                  {
                    lineIndex: current.lineIndex,
                    serials: slots.filter((slot) => slot.trim().length > 0),
                  },
                ],
              },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}
    </>
  );
}
