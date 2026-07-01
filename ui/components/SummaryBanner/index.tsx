"use client";

import { cn } from "@/ui/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "../skeleton";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ReactNode } from "react";

interface SummaryMetric {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    direction?: "up" | "down" | "neutral";
  };
  prefix?: string;
  suffix?: string;
}

interface SummaryBannerProps {
  metrics: SummaryMetric[];
  chart?: ReactNode;
  className?: string;
  isLoading?: boolean;
}

const TrendIcon = ({
  direction,
}: {
  direction?: "up" | "down" | "neutral";
}) => {
  if (direction === "up") return <TrendingUp className="h-3.5 w-3.5" />;
  if (direction === "down") return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

const SummaryBanner = ({
  metrics,
  chart,
  className,
  isLoading,
}: SummaryBannerProps) => {
  // Adapt the column count to the number of metrics (Tailwind needs static class names).
  const count = metrics.length || 4;
  const columnsClass =
    count <= 2 ? "sm:grid-cols-2" : count === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border bg-gradient-to-r from-primary/5 via-primary/3 to-background p-5",
          className,
        )}
      >
        <div className="flex items-center gap-6">
          <div className={cn("flex-1 grid grid-cols-2 gap-4", columnsClass)}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <Skeleton className="hidden lg:block h-20 w-28 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-r from-primary/5 via-primary/3 to-background p-5",
        className,
      )}
    >
      <div className="flex items-center gap-6">
        <div className={cn("flex-1 grid grid-cols-2 gap-4 lg:gap-6", columnsClass)}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const trendColor =
              metric.trend?.direction === "up"
                ? "text-chart-2"
                : metric.trend?.direction === "down"
                  ? "text-destructive"
                  : "text-muted-foreground";

            return (
              <div key={metric.label} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {Icon && (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <p className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
                <div className="flex items-baseline gap-0.5">
                  {metric.prefix && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {metric.prefix}
                    </span>
                  )}
                  <p className="text-xl font-bold tracking-tight">
                    {typeof metric.value === "number"
                      ? metric.value.toLocaleString()
                      : metric.value}
                  </p>
                  {metric.suffix && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {metric.suffix}
                    </span>
                  )}
                </div>
                {metric.trend && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      trendColor,
                    )}
                  >
                    <TrendIcon direction={metric.trend.direction} />
                    <span>{metric.trend.value}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {chart && (
          <div className="hidden lg:flex items-center shrink-0">{chart}</div>
        )}
      </div>
    </div>
  );
};

export default SummaryBanner;
export type { SummaryBannerProps, SummaryMetric };
