"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { cn } from "@/ui/lib/utils";
import type { LocationStockSummary } from "@/services/api/modules/locations/stock-report-api";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  MapPin,
  Package,
  XCircle,
} from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";

interface OverallStatsProps {
  summaries: LocationStockSummary[];
  isLoading: boolean;
}

export function OverallStatsBar({ summaries, isLoading }: OverallStatsProps) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const totals = useMemo(() => {
    if (!summaries?.length)
      return {
        locations: 0,
        products: 0,
        quantity: 0,
        value: 0,
        lowStock: 0,
        outOfStock: 0,
      };
    return {
      locations: summaries.length,
      products: summaries.reduce((a, s) => a + s.totalProducts, 0),
      quantity: summaries.reduce((a, s) => a + s.totalQuantity, 0),
      value: summaries.reduce((a, s) => a + s.totalValue, 0),
      lowStock: summaries.reduce((a, s) => a + s.lowStockCount, 0),
      outOfStock: summaries.reduce((a, s) => a + s.outOfStockCount, 0),
    };
  }, [summaries]);

  const stats = [
    {
      label: "Total Locations",
      value: totals.locations,
      icon: MapPin,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Stock Items",
      value: totals.products.toLocaleString(),
      icon: Package,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Quantity",
      value: totals.quantity.toLocaleString(),
      icon: Boxes,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    ...(canViewCosts
      ? [
          {
            label: "Total Value",
            value: `৳${totals.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            gradient: "from-violet-500/10 to-violet-500/5",
            iconBg: "bg-violet-50 dark:bg-violet-950/40",
            iconColor: "text-violet-600 dark:text-violet-400",
          },
        ]
      : []),
    {
      label: "Low Stock",
      value: totals.lowStock,
      icon: AlertTriangle,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Out of Stock",
      value: totals.outOfStock,
      icon: XCircle,
      gradient: "from-red-500/10 to-red-500/5",
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] rounded-2xl border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card p-4",
              "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60",
                stat.gradient,
              )}
            />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                  {stat.label}
                </p>
                <p className="text-xl font-bold tracking-tight tabular-nums">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  stat.iconBg,
                  "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
                )}
              >
                <Icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
