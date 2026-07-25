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
    trackedItems: number; // count of active inventory rows — the health denominator
    totalItems: number; // SUM of quantity (units in stock) — NOT a row count
    totalValue: number; // cost (purchase) price valuation
    totalRetailValue: number; // quantity × product/variant price
  };
  variants?: {
    lowStock: number;
    outOfStock: number;
  };
}

// Health is a ratio of COUNTS: tracked inventory rows that are neither low nor out.
// The base must be `stock.trackedItems` — never `stock.totalItems` (a sum of
// quantities; subtracting counts from it is meaningless) and never
// `variants.active` (variant docs org-wide: ignores the location filter that
// lowStock/outOfStock honour, and misses products that have no variants).
// Backend already makes lowStock/outOfStock mutually exclusive (lowStock is
// quantity>0), so they never double-subtract; clamp at 0 guards any scope drift.
const deriveHealth = (stats: DashboardStats | undefined) => {
  const activeItems = stats?.stock?.trackedItems || 0;
  const lowStockCount = stats?.variants?.lowStock || 0;
  const outOfStockCount = stats?.variants?.outOfStock || 0;
  const healthyStock = Math.max(0, activeItems - lowStockCount - outOfStockCount);
  const healthyPercentage =
    activeItems > 0 ? Math.round((healthyStock / activeItems) * 100) : 100;
  return { activeItems, lowStockCount, outOfStockCount, healthyStock, healthyPercentage };
};

export const getInventoryKpiStats = (
  stats: DashboardStats | undefined,
  formatCurrency: (value: number) => string,
  t: Translator
): StatData[] => {
  const { activeItems, lowStockCount, outOfStockCount, healthyStock, healthyPercentage } =
    deriveHealth(stats);

  // Funnel order: total (active) → good (healthy) → warning (low) → critical (out).
  return [
    {
      label: t("stats.activeItems"),
      value: activeItems.toLocaleString(),
      icon: Boxes,
      variant: "primary",
      description: t("stats.trackedVariants"),
    },
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
  ];
};

export const getInventorySummaryMetrics = (
  stats: DashboardStats | undefined,
  formatCurrency: (value: number) => string,
  t: Translator
) => {
  const totalValue = stats?.stock?.totalValue || 0;
  const totalRetailValue = stats?.stock?.totalRetailValue || 0;
  const { healthyPercentage } = deriveHealth(stats);

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
