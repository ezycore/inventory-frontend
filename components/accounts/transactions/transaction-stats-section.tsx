"use client";
// coding-standard: maintained

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
  const { data: stats, isLoading } = useTransactionStats(statsParams);
  const { format } = useCurrency();

  // Dynamic trend label based on period
  const trendLabel = stats?.period
    ? `vs previous ${stats.period.chartGrouping === "hourly" ? "day" : stats.period.key === "thisWeek" ? "week" : stats.period.key === "thisMonth" ? "month" : "period"}`
    : "vs previous period";

  // Dynamic chart subtitle
  const chartSubtitle = stats?.period
    ? `${formatPeriodLabel(stats.period)} – ${stats.period.chartGrouping} breakdown`
    : "";

  const statData: StatData[] = [
    {
      label: "Total Income",
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
      label: "Total Expense",
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
      label: "Transfers",
      value: stats ? format(stats.totalTransfers) : "0",
      icon: ArrowRightLeft,
      variant: "info",
    },
    {
      label: "Net Change",
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
            name: "Income",
            color: "var(--color-chart-2)",
          },
          {
            dataKey: "expense",
            name: "Expense",
            color: "var(--color-destructive)",
          },
        ]}
        title="Income vs Expense"
        subtitle={chartSubtitle}
        height={280}
        className="overflow-hidden"
        tooltipFormatter={(v) => format(v)}
      />
    </div>
  );
}
