"use client";

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
  const stats: StatData[] = [
    {
      label: "Total Orders",
      value: summary?.totalOrders ?? 0,
      icon: ShoppingCart,
      variant: "primary",
      description: `${summary?.receivedOrders ?? 0} received, ${summary?.orderedOrders ?? 0} pending`,
    },
    {
      label: "Total Amount",
      value: formatCurrency(summary?.totalAmount ?? 0),
      icon: DollarSign,
      variant: "info",
      description: "All time purchases",
    },
  ];

  if (isAccountsEnabled) {
    stats.push(
      {
        label: "Total Paid",
        value: formatCurrency(summary?.totalPaid ?? 0),
        icon: CheckCircle2,
        variant: "success",
        description: "Amount paid to suppliers",
      },
      {
        label: "Total Due",
        value: formatCurrency(summary?.totalDue ?? 0),
        icon: AlertCircle,
        variant: (summary?.totalDue ?? 0) > 0 ? "destructive" : "success",
        description: "Outstanding balance",
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
