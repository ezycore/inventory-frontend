import { StatData } from "@/ui/components/StatsCard";
import {
  Package,
  AlertTriangle,
  Boxes,
  DollarSign,
  PackageX,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  stock?: {
    totalItems: number;
    totalValue: number;
  };
  variants?: {
    lowStock: number;
    outOfStock: number;
  };
}

export const getInventoryKpiStats = (
  stats: DashboardStats | undefined,
  formatCurrency: (value: number) => string
): StatData[] => {
  const totalItems = stats?.stock?.totalItems || 0;
  const lowStockCount = stats?.variants?.lowStock || 0;
  const outOfStockCount = stats?.variants?.outOfStock || 0;
  const healthyStock = totalItems - lowStockCount - outOfStockCount;
  const healthyPercentage = totalItems > 0 ? Math.round((healthyStock / totalItems) * 100) : 100;

  return [
    {
      label: "Healthy Stock",
      value: healthyStock.toLocaleString(),
      icon: Package,
      variant: "success",
      description: `${healthyPercentage}% of total inventory`,
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      icon: AlertTriangle,
      variant: lowStockCount > 0 ? "warning" : "success",
      description: lowStockCount > 0 ? "Items need restocking" : "All items healthy",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      icon: PackageX,
      variant: outOfStockCount > 0 ? "destructive" : "success",
      description: outOfStockCount > 0 ? "Urgent: No stock available" : "All items in stock",
    },
    {
      label: "Active Items",
      value: totalItems.toLocaleString(),
      icon: Boxes,
      variant: "primary",
      description: "Currently tracked SKUs",
    },
  ];
};

export const getInventorySummaryMetrics = (
  stats: DashboardStats | undefined,
  formatCurrency: (value: number) => string
) => {
  const totalItems = stats?.stock?.totalItems || 0;
  const totalValue = stats?.stock?.totalValue || 0;
  const lowStockCount = stats?.variants?.lowStock || 0;
  const outOfStockCount = stats?.variants?.outOfStock || 0;
  const healthyStock = totalItems - lowStockCount - outOfStockCount;
  const healthyPercentage = totalItems > 0 ? Math.round((healthyStock / totalItems) * 100) : 100;

  return [
    {
      label: "Total SKUs",
      value: totalItems,
      icon: Boxes,
    },
    {
      label: "Stock Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
    },
    {
      label: "Health Score",
      value: `${healthyPercentage}%`,
      icon: BarChart3,
      trend:
        healthyPercentage >= 80
          ? { value: "Good", direction: "up" as const }
          : healthyPercentage >= 50
            ? { value: "Fair", direction: "neutral" as const }
            : { value: "Poor", direction: "down" as const },
    },
    {
      label: "Alerts",
      value: lowStockCount + outOfStockCount,
      icon: AlertTriangle,
      trend:
        lowStockCount + outOfStockCount > 0
          ? { value: `${outOfStockCount} critical`, direction: "down" as const }
          : { value: "Clear", direction: "up" as const },
    },
  ];
};
