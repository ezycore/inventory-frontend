"use client";

import { Undo2, DollarSign, Clock } from "lucide-react";

import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import type { PurchaseReturnsSummary } from "@/types";

interface SummaryCardsProps {
  isSummaryLoading: boolean;
  summary: PurchaseReturnsSummary | undefined;
  formatCurrency: (n: number) => string;
}

export function SummaryCards({
  isSummaryLoading,
  summary,
  formatCurrency,
}: SummaryCardsProps) {
  const stats: StatData[] = [
    {
      label: "Total Returns",
      value: summary?.totalReturns ?? 0,
      icon: Undo2,
      variant: "primary",
      description: "All time",
    },
    {
      label: "Total Refund Amount",
      value: formatCurrency(summary?.totalRefundAmount ?? 0),
      icon: DollarSign,
      variant: "warning",
      description: "Value returned",
    },
    {
      label: "Pending Returns",
      value: summary?.pendingReturns ?? 0,
      icon: Clock,
      variant: "info",
      description: "Awaiting processing",
    },
  ];

  return (
    <StatsCard
      data={stats}
      isLoading={isSummaryLoading}
      columns={{ default: 1, sm: 2, lg: 3 }}
    />
  );
}
