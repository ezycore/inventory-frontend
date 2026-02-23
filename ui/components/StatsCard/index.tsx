import { cn } from "@/ui/lib/utils";
import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../card";
import { Skeleton } from "../skeleton";

type TrendDirection = "up" | "down" | "neutral";

type StatVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info";

interface StatData {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  variant?: StatVariant;
  trend?: {
    value: number | string;
    direction?: TrendDirection;
    label?: string;
  };
  chart?: {
    data: number[];
    color?: string;
  };
  suffix?: string;
  prefix?: string;
  description?: string;
}

interface StatsCardProps {
  data: StatData[];
  isLoading?: boolean;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

const variantStyles: Record<
  StatVariant,
  { bg: string; text: string; icon: string }
> = {
  default: {
    bg: "bg-muted/50",
    text: "text-foreground",
    icon: "text-muted-foreground",
  },
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    icon: "text-primary",
  },
  success: {
    bg: "bg-chart-2/10",
    text: "text-chart-2",
    icon: "text-chart-2",
  },
  warning: {
    bg: "bg-chart-1/10",
    text: "text-chart-1",
    icon: "text-chart-1",
  },
  destructive: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    icon: "text-destructive",
  },
  info: {
    bg: "bg-chart-4/10",
    text: "text-chart-4",
    icon: "text-chart-4",
  },
};

const TrendIcon = ({ direction }: { direction?: TrendDirection }) => {
  if (direction === "up") return <TrendingUp className="h-4 w-4" />;
  if (direction === "down") return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

const MiniChart = ({ data, color }: { data: number[]; color?: string }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-10 mt-2">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            className={cn(
              "flex-1 rounded-sm transition-all",
              color || "bg-primary/60",
            )}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
};

const StatCardItem = ({
  stat,
  isLoading,
}: {
  stat: StatData;
  isLoading?: boolean;
}) => {
  const variant = stat.variant || "default";
  const styles = variantStyles[variant];
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-6 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-32 mb-2" />
      </Card>
    );
  }

  const trendColor =
    stat.trend?.direction === "up"
      ? "text-chart-2"
      : stat.trend?.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {stat.label}
          </p>
          {stat.description && (
            <p className="text-xs text-muted-foreground/70">
              {stat.description}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-lg", styles.bg)}>
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          {stat.prefix && (
            <span className="text-lg font-semibold text-muted-foreground">
              {stat.prefix}
            </span>
          )}
          <h3 className={cn("text-3xl font-bold tracking-tight", styles.text)}>
            {stat.value.toLocaleString()}
          </h3>
          {stat.suffix && (
            <span className="text-lg font-semibold text-muted-foreground">
              {stat.suffix}
            </span>
          )}
        </div>

        {stat.trend && (
          <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
            <TrendIcon direction={stat.trend.direction} />
            <span className="font-medium">{stat.trend.value}</span>
            {stat.trend.label && (
              <span className="text-muted-foreground">{stat.trend.label}</span>
            )}
          </div>
        )}
      </div>

      {stat.chart && (
        <MiniChart data={stat.chart.data} color={stat.chart.color} />
      )}
    </Card>
  );
};

const StatsCard = ({ data, isLoading, columns }: StatsCardProps) => {
  if (!data) return null;

  const gridCols = columns || { default: 1, sm: 2, lg: data.length };
  const gridClass = cn(
    "grid gap-4",
    `grid-cols-${gridCols.default || 1}`,
    gridCols.sm && `sm:grid-cols-${gridCols.sm}`,
    gridCols.md && `md:grid-cols-${gridCols.md}`,
    gridCols.lg && `lg:grid-cols-${gridCols.lg}`,
    gridCols.xl && `xl:grid-cols-${gridCols.xl}`,
  );

  return (
    <div className={gridClass}>
      {data.map((stat, index) => (
        <StatCardItem
          key={stat.label + index}
          stat={stat}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default StatsCard;
export type { StatData, StatsCardProps, StatVariant, TrendDirection };
