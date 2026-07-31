"use client";
// coding-standard: maintained

import { useLocale, useTranslations } from "next-intl";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import { AreaChart } from "@/ui/components/charts";
import {
  ArrowRightLeft,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { formatPeriodLabel } from "@/components/dashboard/helpers";
import { useTransactionStats } from "@/services/api";
import type { AppLocale } from "@/i18n/config";

export interface TransactionStatsParams {
  period?: string;
  weekStartDay?: number;
  startDate?: string;
  endDate?: string;
}

export function TransactionStatsSection({
  statsParams,
}: {
  statsParams?: TransactionStatsParams;
}) {
  const t = useTranslations("accounts.transactions.stats");
  const locale = useLocale() as AppLocale;
  const { data: stats, isLoading } = useTransactionStats(statsParams);
  const { format } = useCurrency();

  // Dynamic trend label based on period
  const trendLabel = stats?.period
    ? stats.period.chartGrouping === "hourly"
      ? t("vsPreviousDay")
      : stats.period.key === "thisWeek"
        ? t("vsPreviousWeek")
        : stats.period.key === "thisMonth"
          ? t("vsPreviousMonth")
          : t("vsPreviousPeriod")
    : t("vsPreviousPeriod");

  // Dynamic chart subtitle
  const chartSubtitle = stats?.period
    ? t("breakdownSuffix", {
        period: formatPeriodLabel(stats.period, locale),
        grouping: stats.period.chartGrouping,
      })
    : "";

  // Cash in / cash out, NOT the P&L's income and expense. These totals include the cash leg of
  // sales and purchases (settlement) and exclude owner capital, which is reported on its own tile
  // below — see `classifyTxn` in the backend. Labelling them "income"/"expense" is what made this
  // page disagree with the profit report.
  const statData: StatData[] = [
    {
      label: t("cashIn"),
      value: stats ? format(stats.totalIncome) : "0",
      icon: TrendingUp,
      variant: "success",
      trend: stats
        ? {
          value: `${stats.incomeTrend >= 0 ? "+" : ""}${stats.incomeTrend}%`,
          direction: stats.incomeTrend >= 0 ? "up" : "down",
          label: trendLabel,
        }
        : undefined,
      prefix: "+",
    },
    {
      label: t("cashOut"),
      value: stats ? format(stats.totalExpense) : "0",
      icon: TrendingDown,
      variant: "destructive",
      trend: stats
        ? {
          value: `${stats.expenseTrend >= 0 ? "+" : ""}${stats.expenseTrend}%`,
          direction: stats.expenseTrend >= 0 ? "up" : "down",
          label: trendLabel,
          // Rising cash out is a cost, not growth — colour it red while the arrow stays honest.
          higherIsBetter: false,
        }
        : undefined,
      prefix: "-",
    },
    {
      label: t("transfers"),
      value: stats ? format(stats.totalTransfers) : "0",
      icon: ArrowRightLeft,
      variant: "info",
    },
    {
      // Owner money in minus out. It moves real cash — so it is in every account balance — but it
      // is neither income nor expense, so the two tiles above exclude it. Until this tile existed
      // a withdrawal appeared in the list and in no total at all, and the page did not add up.
      label: t("ownerCapital"),
      value: stats ? format(Math.abs(stats.netCapital)) : "0",
      icon: PiggyBank,
      variant: stats && stats.netCapital >= 0 ? "success" : "warning",
      prefix: stats && stats.netCapital >= 0 ? "+" : "-",
    },
    {
      label: t("netChange"),
      value: stats ? format(Math.abs(stats.netChange)) : "0",
      icon: Wallet,
      variant: stats && stats.netChange >= 0 ? "success" : "destructive",
      trend: stats
        ? {
          value: `${stats.netTrend >= 0 ? "+" : ""}${stats.netTrend}%`,
          direction: stats.netTrend >= 0 ? "up" : "down",
          label: trendLabel,
        }
        : undefined,
      prefix: stats && stats.netChange >= 0 ? "+" : "-",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCard
        data={statData}
        isLoading={isLoading}
        columns={{ default: 1, sm: 2, lg: 3, xl: 5 }}
      />

      {/* Income vs Expense Area Chart */}
      <AreaChart
        data={stats?.chartData || []}
        series={[
          {
            dataKey: "income",
            name: t("chartIncome"),
            color: "var(--color-chart-2)",
          },
          {
            dataKey: "expense",
            name: t("chartExpense"),
            color: "var(--color-destructive)",
          },
        ]}
        title={t("chartTitle")}
        subtitle={chartSubtitle}
        height={280}
        className="overflow-hidden"
        tooltipFormatter={(v) => format(v)}
      />
    </div>
  );
}
