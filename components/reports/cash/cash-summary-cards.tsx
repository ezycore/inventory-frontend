"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import StatsCard, { type StatData } from "@ui/components/StatsCard";
import { useCurrency } from "@/lib/currency";
import type { CashReport } from "@/types/api";

type CashSummary = CashReport["summary"];

/** Percent change against the same-length previous period. */
function calcChange(current: number, previous: number) {
  if (previous === 0 && current === 0)
    return { value: 0, direction: "neutral" as const };
  if (previous === 0) return { value: 100, direction: "up" as const };
  const pct = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(pct)),
    direction:
      pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("neutral" as const),
  };
}

/**
 * The five cash figures, in the same order and the same words as the ledger page's tiles
 * (`components/accounts/transactions/transaction-stats-section.tsx`) — the two screens report the
 * same numbers, so they must not use different names for them.
 */
export function CashSummaryCards({
  summary,
  capitalCount,
  isLoading,
}: {
  summary?: CashSummary;
  /** Equity rows in the period, so the tile counts add up to the account table's total. */
  capitalCount: number;
  isLoading?: boolean;
}) {
  const t = useTranslations("reports.cash");
  const tCommon = useTranslations("reports");
  const { format: formatCurrency } = useCurrency();

  const incomeChange = summary
    ? calcChange(summary.totalIncome, summary.previousIncome)
    : null;
  const expenseChange = summary
    ? calcChange(summary.totalExpense, summary.previousExpense)
    : null;

  const stats: StatData[] = [
    {
      label: t("totalBalance"),
      value: summary ? formatCurrency(summary.totalBalance) : "0",
      icon: Wallet,
      description: summary
        ? t("acrossAccounts", { count: summary.accountCount })
        : undefined,
    },
    {
      // Cash, not revenue: settlement (the cash leg of a sale) is in, owner capital is out. The
      // profit report answers a different question and will show a different number.
      label: t("cashIn"),
      value: summary ? formatCurrency(summary.totalIncome) : "0",
      icon: TrendingUp,
      variant: "success",
      prefix: "+",
      trend:
        incomeChange && incomeChange.direction !== "neutral"
          ? {
              value: tCommon("vsPrevious", { value: incomeChange.value }),
              direction: incomeChange.direction,
            }
          : undefined,
    },
    {
      label: t("cashOut"),
      value: summary ? formatCurrency(summary.totalExpense) : "0",
      icon: TrendingDown,
      variant: "destructive",
      prefix: "-",
      trend:
        expenseChange && expenseChange.direction !== "neutral"
          ? {
              value: tCommon("vsPrevious", { value: expenseChange.value }),
              direction: expenseChange.direction,
              // Cash going out is a cost: rising is bad news, so the arrow keeps pointing up
              // while the colour turns red.
              higherIsBetter: false,
            }
          : undefined,
    },
    {
      // Owner money in minus out. It moves real cash, so it is inside Total Balance — but it is
      // neither income nor expense, which is why the two tiles above exclude it. The category
      // breakdown below lists it under its own heading for the same reason.
      label: t("ownerCapital"),
      value: summary ? formatCurrency(Math.abs(summary.netCapital)) : "0",
      icon: PiggyBank,
      variant: summary && summary.netCapital >= 0 ? "success" : "warning",
      prefix: summary && summary.netCapital >= 0 ? "+" : "-",
      description: t("capitalEntriesCount", { count: capitalCount }),
    },
    {
      label: t("netCashFlow"),
      value: summary ? formatCurrency(Math.abs(summary.netCashFlow)) : "0",
      icon: Wallet,
      variant: summary && summary.netCashFlow >= 0 ? "success" : "destructive",
      prefix: summary && summary.netCashFlow >= 0 ? "+" : "-",
      description: summary
        ? t("transactionsCount", {
            count: summary.incomeCount + summary.expenseCount,
          })
        : undefined,
    },
  ];

  return (
    <StatsCard
      data={stats}
      isLoading={isLoading}
      columns={{ default: 1, sm: 2, lg: 3, xl: 5 }}
    />
  );
}
