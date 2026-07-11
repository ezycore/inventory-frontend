// coding-standard: maintained
import { StatData } from "@/ui/components/StatsCard";
import type { Translator } from "@/i18n/config";
import {
  Package,
  AlertTriangle,
  Boxes,
  DollarSign,
  PackageX,
  BarChart3,
  Wallet,
} from "lucide-react";

interface DashboardStats {
  stock?: {
    totalItems: number;
    totalValue: number; // cost (purchase) price valuation
    totalRetailValue: number; // quantity × product/variant price
  };
  variants?: {
    lowStock: number;
    outOfStock: number;
  };
}

export const getInventoryKpiStats = (
  stats: DashboardStats | undefined,
  formatCurrency: (value: number) => string,
  t: Translator
): StatData[] => {
  const totalItems = stats?.stock?.totalItems || 0;
  const lowStockCount = stats?.variants?.lowStock || 0;
  const outOfStockCount = stats?.variants?.outOfStock || 0;
  const healthyStock = totalItems - lowStockCount - outOfStockCount;
  const healthyPercentage = totalItems > 0 ? Math.round((healthyStock / totalItems) * 100) : 100;

  return [
    {
      label: t("stats.healthyStock"),
      value: healthyStock.toLocaleString(),
      icon: Package,
      variant: "success",
      description: t("stats.healthyPct", { percentage: healthyPercentage }),
    },
    {
      label: t("stats.lowStock"),
      value: lowStockCount,
      icon: AlertTriangle,
      variant: lowStockCount > 0 ? "warning" : "success",
      description: lowStockCount > 0 ? t("stats.needRestocking") : t("stats.allHealthy"),
    },
    {
      label: t("stats.outOfStock"),
      value: outOfStockCount,
      icon: PackageX,
      variant: outOfStockCount > 0 ? "destructive" : "success",
      description: outOfStockCount > 0 ? t("stats.urgentNoStock") : t("stats.allInStock"),
    },
    {
      label: t("stats.activeItems"),
      value: totalItems.toLocaleString(),
      icon: Boxes,
      variant: "primary",
      description: t("stats.trackedVariants"),
    },
  ];
};

export const getInventorySummaryMetrics = (
  stats: DashboardStats | undefined,
  formatCurrency: (value: number) => string,
  t: Translator
) => {
  const totalItems = stats?.stock?.totalItems || 0;
  const totalValue = stats?.stock?.totalValue || 0;
  const totalRetailValue = stats?.stock?.totalRetailValue || 0;
  const lowStockCount = stats?.variants?.lowStock || 0;
  const outOfStockCount = stats?.variants?.outOfStock || 0;
  const healthyStock = totalItems - lowStockCount - outOfStockCount;
  const healthyPercentage = totalItems > 0 ? Math.round((healthyStock / totalItems) * 100) : 100;

  return [
    {
      label: t("stats.totalInventoryPrice"),
      value: formatCurrency(totalRetailValue),
      icon: Wallet,
    },
    {
      label: t("stats.stockValueCost"),
      value: formatCurrency(totalValue),
      icon: DollarSign,
    },
    {
      label: t("stats.healthScore"),
      value: `${healthyPercentage}%`,
      icon: BarChart3,
      trend:
        healthyPercentage >= 80
          ? { value: t("stats.good"), direction: "up" as const }
          : healthyPercentage >= 50
            ? { value: t("stats.fair"), direction: "neutral" as const }
            : { value: t("stats.poor"), direction: "down" as const },
    },
  ];
};
