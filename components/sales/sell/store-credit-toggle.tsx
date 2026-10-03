"use client";
// coding-standard: maintained
import { useId } from "react";
import { WalletIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { Switch } from "@/ui/components/switch";
import { formatCurrency } from "@/components/sales";
import type { SellPageContext } from "./use-sell-page";

/**
 * "Use store credit" — spend the selected customer's credit balance on this
 * sale. Renders nothing unless the customer has credit and the cart has a total.
 * Shared by New Sale and the POS counter.
 */
export function StoreCreditToggle({ ctx }: { ctx: SellPageContext }) {
  const t = useTranslations("sales.sell.summary");
  const id = useId();
  const {
    isAccountsEnabled,
    customerCreditBalance,
    totalSalePrice,
    useCreditBalance,
    setUseCreditBalance,
    creditBalanceAmount,
    setCreditBalanceAmount,
    maxCreditApplicable,
  } = ctx;

  if (!isAccountsEnabled || customerCreditBalance <= 0 || totalSalePrice <= 0) return null;

  return (
    <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <WalletIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {t("useStoreCredit")}
        </Label>
        <Switch
          id={id}
          checked={useCreditBalance}
          onCheckedChange={(checked) => {
            setUseCreditBalance(checked);
            if (!checked) setCreditBalanceAmount(0);
            else setCreditBalanceAmount(maxCreditApplicable);
          }}
        />
      </div>
      {useCreditBalance && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("available", { amount: formatCurrency(customerCreditBalance) })}
          </span>
          <NumberField
            precision={2}
            min={0}
            max={maxCreditApplicable}
            value={creditBalanceAmount}
            onChange={(next) =>
              setCreditBalanceAmount(Math.max(0, Math.min(maxCreditApplicable, next ?? 0)))
            }
            className="w-28 h-8 text-right text-sm"
          />
        </div>
      )}
    </div>
  );
}
