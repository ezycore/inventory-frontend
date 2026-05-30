"use client";

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
  if (!isAccountsEnabled) return null;
  return (
    <div className="px-6 py-4 border-b bg-muted/30">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="text-lg font-semibold text-green-600">
            {isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Due</p>
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
          <p className="text-xs text-muted-foreground">Refunded</p>
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
              + {formatCurrency(totalRefundCredit)} credit
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Store Credit</p>
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
