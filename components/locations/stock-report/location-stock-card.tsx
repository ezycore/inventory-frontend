"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Progress } from "@/ui/components/progress";
import { Skeleton } from "@/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import type { LocationStockSummary } from "@/services/api/modules/locations/stock-report-api";
import { Eye, Store, Warehouse } from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";

interface LocationCardProps {
  location: LocationStockSummary;
  onSelect: (locationId: string) => void;
}

export function LocationStockCard({ location, onSelect }: LocationCardProps) {
  const t = useTranslations("settings.locations.stockReport");
  const tType = useTranslations("settings.locations.type");
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const totalCapacity =
    location.inStockCount + location.lowStockCount + location.outOfStockCount;
  const healthPercent =
    totalCapacity > 0
      ? Math.round((location.inStockCount / totalCapacity) * 100)
      : 0;

  const healthColor =
    healthPercent >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : healthPercent >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const progressColor =
    healthPercent >= 70
      ? "bg-emerald-500"
      : healthPercent >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 py-0 gap-0 overflow-hidden"
      onClick={() => onSelect(location.locationId)}
    >
      {/* Header */}
      <div className="relative p-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
                location.locationType === "warehouse"
                  ? "bg-amber-50 dark:bg-amber-950/40"
                  : "bg-blue-50 dark:bg-blue-950/40",
              )}
            >
              {location.locationType === "warehouse" ? (
                <Warehouse className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                {location.locationName}
              </h3>
              <span className="text-[11px] text-muted-foreground capitalize">
                {location.locationType === "warehouse" ? tType("warehouse") : tType("store")}
              </span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("viewDetailedReport")}</TooltipContent>
          </Tooltip>
        </div>

        {/* Stock Value — cost-derived, costs.view only */}
        {canViewCosts && (
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-0.5">
              {t("detail.stockValue")}
            </p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              ৳{location.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Health bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("stockHealth")}</span>
            <span className={cn("font-semibold tabular-nums", healthColor)}>
              {healthPercent}%
            </span>
          </div>
          <Progress
            value={healthPercent}
            className="h-1.5"
            indicatorClassName={progressColor}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t bg-muted/30 px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          <StockMiniStat
            label={t("miniItems")}
            value={location.totalProducts}
            color="text-foreground"
          />
          <StockMiniStat
            label={t("miniQty")}
            value={location.totalQuantity}
            color="text-foreground"
          />
          <StockMiniStat
            label={t("miniLow")}
            value={location.lowStockCount}
            color="text-amber-600 dark:text-amber-400"
          />
          <StockMiniStat
            label={t("miniOut")}
            value={location.outOfStockCount}
            color="text-red-600 dark:text-red-400"
          />
        </div>
      </div>
    </Card>
  );
}

function StockMiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={cn("text-sm font-bold tabular-nums", color)}>
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-muted-foreground/60">{label}</p>
    </div>
  );
}

export function LocationCardSkeleton() {
  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <div className="p-5 pb-4 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
      <div className="border-t bg-muted/30 px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-2 w-6" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
