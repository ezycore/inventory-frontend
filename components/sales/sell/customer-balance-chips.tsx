"use client";
// coding-standard: maintained
import { WalletIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import { cn } from "@ui/lib/utils";
import type { SellPageContext } from "./use-sell-page";

/**
 * The selected customer's standing — what they still owe ("Due") and the store
 * credit they hold. Renders nothing for a customer with neither. Shared by New
 * Sale and the POS counter.
 */
export function CustomerBalanceChips({
  ctx,
  className,
}: {
  ctx: SellPageContext;
  className?: string;
}) {
  const t = useTranslations("sales.sell.summary");
  const { showCustomerBalances, customerOutstandingDue, customerCreditBalance } = ctx;

  if (!showCustomerBalances) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {customerOutstandingDue > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
          {t("dueChip", { amount: formatCurrency(customerOutstandingDue) })}
        </span>
      )}
      {customerCreditBalance > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <WalletIcon className="h-3 w-3" />
          {t("creditChip", { amount: formatCurrency(customerCreditBalance) })}
        </span>
      )}
    </div>
  );
}
