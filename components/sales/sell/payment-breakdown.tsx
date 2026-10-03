"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import { cn } from "@ui/lib/utils";
import type { SellPageContext } from "./use-sell-page";

/**
 * Paid / store credit applied / Due / Change, under the payment fields.
 * Shared by New Sale and the POS counter.
 *
 * Change is what was handed over beyond what this sale still needs AFTER store
 * credit — the same base `dueAmount` uses. Comparing against the full total
 * hid the change whenever credit was applied.
 */
export function PaymentBreakdown({
  ctx,
  emphasizeChange = false,
}: {
  ctx: SellPageContext;
  /** The counter shows Change large — it is the number the cashier hands back. */
  emphasizeChange?: boolean;
}) {
  const t = useTranslations("sales.sell.summary");
  const { isAccountsEnabled, paidAmount, appliedCredit, dueAmount, totalSalePrice } = ctx;

  if (!isAccountsEnabled || (paidAmount <= 0 && appliedCredit <= 0)) return null;

  const change = paidAmount - Math.max(totalSalePrice - appliedCredit, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("paid")}</span>
        <span className="font-semibold text-green-600 dark:text-green-500 tabular-nums">
          {formatCurrency(paidAmount)}
        </span>
      </div>
      {appliedCredit > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("storeCreditApplied")}</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            −{formatCurrency(appliedCredit)}
          </span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("due")}</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            dueAmount > 0
              ? "text-orange-600 dark:text-orange-500"
              : "text-green-600 dark:text-green-500",
          )}
        >
          {formatCurrency(dueAmount)}
        </span>
      </div>
      {change > 0 && (
        <div
          className={cn(
            "flex justify-between items-center",
            emphasizeChange
              ? "mt-1 rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950/30"
              : "text-sm",
          )}
        >
          <span className={emphasizeChange ? "font-semibold text-green-700 dark:text-green-400" : "text-muted-foreground"}>
            {t("change")}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              emphasizeChange
                ? "text-xl text-green-700 dark:text-green-400"
                : "text-blue-600 dark:text-blue-400",
            )}
          >
            {formatCurrency(change)}
          </span>
        </div>
      )}
    </div>
  );
}
