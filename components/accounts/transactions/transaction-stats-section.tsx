"use client";
// coding-standard: maintained

import { useLocale, useTranslations } from "next-intl";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import { AreaChart } from "@/ui/components/charts";
import {
  ArrowRightLeft,
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

  const statData: StatData[] = [
    {
      label: t("totalIncome"),
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
      label: t("totalExpense"),
      value: stats ? format(stats.totalExpense) : "0",
      icon: TrendingDown,
      variant: "destructive",
      trend: stats
        ? {
          value: `${stats.expenseTrend >= 0 ? "+" : ""}${stats.expenseTrend}%`,
          direction: stats.expenseTrend >= 0 ? "up" : "down",
          label: trendLabel,
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
        columns={{ default: 1, sm: 2, lg: 4 }}
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
