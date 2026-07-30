"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";

interface CustomerLedgerSummaryProps {
  isAccountsEnabled: boolean;
  isLoading: boolean;
  totalPaid: number;
  totalDue: number;
  totalRefunded: number;
  totalRefundCredit: number;
  creditBalance: number;
  formatCurrency: (n: number) => string;
}

export function CustomerLedgerSummary({
  isAccountsEnabled,
  isLoading,
  totalPaid,
  totalDue,
  totalRefunded,
  totalRefundCredit,
  creditBalance,
  formatCurrency,
}: CustomerLedgerSummaryProps) {
  const t = useTranslations("customers.ledger");
  if (!isAccountsEnabled) return null;
  return (
    <div className="px-6 py-4 border-b bg-muted/30">
      {/* 2×2, not 4-across: `md:` is a viewport breakpoint, so inside a 550px
          sheet four columns leave ~113px each and clip long currency values. */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("statTotalPaid")}</p>
          <p className="text-lg font-semibold text-green-600">
            {isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("statTotalDue")}</p>
          <p
            className={cn(
              "text-lg font-semibold",
              totalDue > 0 ? "text-red-600" : "text-green-600",
            )}
          >
            {isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totalDue)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("statRefunded")}</p>
          <p
            className={cn(
              "text-lg font-semibold",
              totalRefunded > 0 ? "text-red-600" : "text-muted-foreground",
            )}
          >
            {isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totalRefunded)}
          </p>
          {totalRefundCredit > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {t("creditSuffix", { amount: formatCurrency(totalRefundCredit) })}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("statStoreCredit")}</p>
          <p
            className={cn(
              "text-lg font-semibold",
              creditBalance > 0 ? "text-blue-600" : "text-muted-foreground",
            )}
          >
            {isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(creditBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}
