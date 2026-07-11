"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
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
  const t = useTranslations("purchases.returns");
  const stats: StatData[] = [
    {
      label: t("statTotalReturns"),
      value: summary?.totalReturns ?? 0,
      icon: Undo2,
      variant: "primary",
      description: t("statTotalReturnsDesc"),
    },
    {
      label: t("statRefundAmount"),
      value: formatCurrency(summary?.totalRefundAmount ?? 0),
      icon: DollarSign,
      variant: "warning",
      description: t("statRefundAmountDesc"),
    },
    {
      label: t("statPending"),
      value: summary?.pendingReturns ?? 0,
      icon: Clock,
      variant: "info",
      description: t("statPendingDesc"),
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
