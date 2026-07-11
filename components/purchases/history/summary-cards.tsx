"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ShoppingCart, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

import StatsCard, { type StatData } from "@/ui/components/StatsCard";

interface SummaryCardsProps {
  isAccountsEnabled: boolean;
  isSummaryLoading: boolean;
  summary?: {
    totalOrders?: number;
    receivedOrders?: number;
    orderedOrders?: number;
    totalAmount?: number;
    totalPaid?: number;
    totalDue?: number;
  };
  formatCurrency: (n: number) => string;
}

export function SummaryCards({
  isAccountsEnabled,
  isSummaryLoading,
  summary,
  formatCurrency,
}: SummaryCardsProps) {
  const t = useTranslations("purchases.history");
  const stats: StatData[] = [
    {
      label: t("statTotalOrders"),
      value: summary?.totalOrders ?? 0,
      icon: ShoppingCart,
      variant: "primary",
      description: t("statTotalOrdersDesc", {
        received: summary?.receivedOrders ?? 0,
        pending: summary?.orderedOrders ?? 0,
      }),
    },
    {
      label: t("statTotalAmount"),
      value: formatCurrency(summary?.totalAmount ?? 0),
      icon: DollarSign,
      variant: "info",
      description: t("statTotalAmountDesc"),
    },
  ];

  if (isAccountsEnabled) {
    stats.push(
      {
        label: t("statTotalPaid"),
        value: formatCurrency(summary?.totalPaid ?? 0),
        icon: CheckCircle2,
        variant: "success",
        description: t("statTotalPaidDesc"),
      },
      {
        label: t("statTotalDue"),
        value: formatCurrency(summary?.totalDue ?? 0),
        icon: AlertCircle,
        variant: (summary?.totalDue ?? 0) > 0 ? "destructive" : "success",
        description: t("statTotalDueDesc"),
      },
    );
  }

  return (
    <StatsCard
      data={stats}
      isLoading={isSummaryLoading}
      columns={{ default: 1, sm: 2, lg: isAccountsEnabled ? 4 : 2 }}
    />
  );
}
