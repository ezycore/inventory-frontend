"use client";
// coding-standard: maintained
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { useAccountPaymentOptions } from "@/services/api";
import { Button } from "@/ui/components/button";
import { cn } from "@ui/lib/utils";

/**
 * Where the money goes — the same account list New Sale's "Payment Method"
 * select offers (`/accounts/payment-options`), as one-tap buttons. Writes the
 * same `accountId` form field, so the sale posts exactly as it does there.
 */
export function PosPaymentMethods({ ctx }: { ctx: SellPageContext }) {
  const t = useTranslations("sales.sell.form");
  const { data: accounts = [] } = useAccountPaymentOptions(ctx.isAccountsEnabled);
  const selected = useWatch({ control: ctx.customerForm.control, name: "accountId" });

  if (!ctx.isAccountsEnabled || accounts.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium">{t("paymentMethod")}</div>
      {/* As many per row as fit whole names — "bKash Merchant" must not truncate. */}
      <div
        role="radiogroup"
        aria-label={t("paymentMethod")}
        className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5"
      >
        {accounts.map((account) => {
          const active = selected === account._id;
          return (
            <Button
              key={account._id}
              type="button"
              role="radio"
              aria-checked={active}
              variant="outline"
              title={account.name}
              onClick={() => ctx.customerForm.setValue("accountId", account._id, { shouldDirty: true })}
              className={cn(
                "h-10 min-w-0 px-2",
                active && "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
              )}
            >
              <span className="truncate">{account.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
