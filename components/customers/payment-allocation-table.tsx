"use client";
// coding-standard: maintained

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/ui/components/checkbox";
import { NumberField } from "@/ui/components/number-field";
import { cn } from "@/ui/lib/utils";
import type { CustomerOutstandingSale } from "@/types";

interface PaymentAllocationTableProps {
  sales: CustomerOutstandingSale[];
  /** saleId → amount this receipt puts against that invoice. */
  allocations: Record<string, number>;
  onChangeAllocation: (saleId: string, amount: number) => void;
  formatCurrency: (n: number) => string;
  disabled?: boolean;
}

/**
 * The invoice-by-invoice split of a customer receipt, oldest first.
 *
 * Rows are seeded by the caller's oldest-first fill; editing a row or clearing
 * its checkbox switches the receipt to a manual split, which is sent to the
 * server verbatim instead of being re-derived there.
 */
export function PaymentAllocationTable({
  sales,
  allocations,
  onChangeAllocation,
  formatCurrency,
  disabled = false,
}: PaymentAllocationTableProps) {
  const t = useTranslations("customers.bulkPayment");

  return (
    <div className="rounded-lg border divide-y">
      <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span className="w-4" />
        <span>{t("invoiceColumn")}</span>
        <span className="text-right">{t("allocatedColumn")}</span>
      </div>

      {sales.map((sale) => {
        const allocated = allocations[sale._id] ?? 0;
        const isSettled = allocated >= sale.dueAmount - 0.01;

        return (
          <div
            key={sale._id}
            className="grid grid-cols-[auto_1fr_auto] gap-2 items-center px-3 py-2"
          >
            <Checkbox
              checked={allocated > 0}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChangeAllocation(sale._id, checked ? sale.dueAmount : 0)
              }
              aria-label={sale.invoiceNumber}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm truncate">{sale.invoiceNumber}</span>
                {isSettled && allocated > 0 && (
                  <span className="text-[10px] uppercase tracking-wide text-green-600">
                    {t("settled")}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(sale.createdAt), "dd MMM yyyy")} ·{" "}
                <span className={cn(sale.dueAmount > 0 && "text-red-600")}>
                  {t("dueOf", { amount: formatCurrency(sale.dueAmount) })}
                </span>
              </div>
            </div>

            <div className="w-28">
              <NumberField
                precision={2}
                min={0}
                max={sale.dueAmount}
                value={allocated || null}
                onChange={(v) => onChangeAllocation(sale._id, v ?? 0)}
                disabled={disabled}
                aria-label={t("allocatedColumn")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
