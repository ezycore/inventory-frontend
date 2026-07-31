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
  | "danger"
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
    /**
     * Whether a rising number is good news, which is what the trend colour reports. Defaults to
     * `true`; pass `false` on cost metrics (expenses, cash out, returns) so growth reads red.
     */
    higherIsBetter?: boolean;
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

const variantStyles: Record<StatVariant, { bg: string; text: string; icon: string }> = {
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
  danger: {
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
      <Card className="p-5 gap-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            {stat.description && <Skeleton className="h-3 w-20" />}
          </div>
          {stat.icon && <Skeleton className="h-10 w-10 rounded-lg" />}
        </div>
        <div className="space-y-1 mt-1">
          <Skeleton className="h-7 w-28" />
          {stat.trend && <Skeleton className="h-4 w-32" />}
        </div>
        {stat.chart && <Skeleton className="h-10 w-full mt-2 rounded" />}
      </Card>
    );
  }

  // The arrow always points the way the number moved; only the colour says whether that is good
  // news. On a cost metric it is the other way round — rising expenses in green read as a win.
  const risingIsGood = stat.trend?.higherIsBetter !== false;
  const trendColor =
    stat.trend?.direction === "up"
      ? risingIsGood
        ? "text-chart-2"
        : "text-destructive"
      : stat.trend?.direction === "down"
        ? risingIsGood
          ? "text-destructive"
          : "text-chart-2"
        : "text-muted-foreground";

  return (
    <Card className="p-5 hover:shadow-md transition-shadow gap-2">
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
          <h3 className={cn("text-2xl font-bold tracking-tight", styles.text)}>
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

// Static grid-cols mappings (Tailwind can't detect dynamic classes)
const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};
const smColsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};
const mdColsMap: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};
const lgColsMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};
const xlColsMap: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

const StatsCard = ({ data, isLoading, columns }: StatsCardProps) => {
  if (!data) return null;

  const gridCols = columns || { default: 1, sm: 2, lg: data.length };
  const gridClass = cn(
    "grid gap-4",
    colsMap[gridCols.default || 1] || "grid-cols-1",
    gridCols.sm && (smColsMap[gridCols.sm] || ""),
    gridCols.md && (mdColsMap[gridCols.md] || ""),
    gridCols.lg && (lgColsMap[gridCols.lg] || ""),
    gridCols.xl && (xlColsMap[gridCols.xl] || ""),
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
