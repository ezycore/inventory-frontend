// coding-standard: maintained
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
  /**
   * Opt-in responsive mode: cards flex-wrap to however many fit the
   * container's actual width and the last row's cards stretch to fill it —
   * use instead of `columns` when a fixed-width sidebar makes viewport
   * breakpoints size columns wrong (a `lg`/`xl` step doesn't reflect how much
   * width is actually left beside the sidebar). Ignored if `columns` is set.
   */
  minCardWidth?: number;
  /**
   * With a 2-wide `columns.default` track and an odd number of cards, the last
   * card spans the whole phone row instead of sitting beside an empty cell.
   * Reset at `lg`, whose track the caller sizes to fit. Opt-in.
   */
  stretchPhoneOrphan?: boolean;
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
    bg: "bg-success/10",
    text: "text-success",
    icon: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    icon: "text-warning",
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
        ? "text-success"
        : "text-destructive"
      : stat.trend?.direction === "down"
        ? risingIsGood
          ? "text-destructive"
          : "text-success"
        : "text-muted-foreground";

  return (
    <Card className="min-w-0 p-4 sm:p-5 hover:shadow-md transition-shadow gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1 break-words">
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
          <div className={cn("shrink-0 p-2 sm:p-2.5 rounded-lg", styles.bg)}>
            <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", styles.icon)} />
          </div>
        )}
      </div>

      {/* The value scales with the card, not the viewport: a two-up phone grid leaves ~140px,
          which a lakh-grouped amount like ৳2,01,750.00 overran at text-2xl. */}
      <div className="@container min-w-0 space-y-1">
        <div className="flex items-baseline gap-1">
          {stat.prefix && (
            <span className="text-lg font-semibold text-muted-foreground">
              {stat.prefix}
            </span>
          )}
          <h3
            className={cn(
              "min-w-0 text-lg @[10rem]:text-xl @[13rem]:text-2xl font-bold tracking-tight tabular-nums [overflow-wrap:anywhere]",
              styles.text,
            )}
          >
            {stat.value.toLocaleString()}
          </h3>
          {stat.suffix && (
            <span className="text-lg font-semibold text-muted-foreground">
              {stat.suffix}
            </span>
          )}
        </div>

        {stat.trend && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-1 text-sm",
              trendColor,
            )}
          >
            <TrendIcon direction={stat.trend.direction} />
            <span className="font-medium">{stat.trend.value}</span>
            {stat.trend.label && (
              <span className="whitespace-nowrap text-muted-foreground">
                {stat.trend.label}
              </span>
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

const StatsCard = ({
  data,
  isLoading,
  columns,
  minCardWidth,
  stretchPhoneOrphan,
}: StatsCardProps) => {
  if (!data) return null;

  if (!columns && minCardWidth) {
    return (
      <div className="flex flex-wrap gap-4">
        {data.map((stat, index) => (
          <div
            key={stat.label + index}
            className="grow"
            style={{ flexBasis: minCardWidth }}
          >
            <StatCardItem stat={stat} isLoading={isLoading} />
          </div>
        ))}
      </div>
    );
  }

  const gridCols = columns || { default: 1, sm: 2, lg: data.length };
  const gridClass = cn(
    "grid gap-4",
    colsMap[gridCols.default || 1] || "grid-cols-1",
    gridCols.sm && (smColsMap[gridCols.sm] || ""),
    gridCols.md && (mdColsMap[gridCols.md] || ""),
    gridCols.lg && (lgColsMap[gridCols.lg] || ""),
    gridCols.xl && (xlColsMap[gridCols.xl] || ""),
  );

  const orphanIndex =
    stretchPhoneOrphan && gridCols.default === 2 && data.length % 2 === 1
      ? data.length - 1
      : -1;

  return (
    <div className={gridClass}>
      {data.map((stat, index) =>
        index === orphanIndex ? (
          <div
            key={stat.label + index}
            className="col-span-2 lg:col-span-1 [&>*]:h-full"
          >
            <StatCardItem stat={stat} isLoading={isLoading} />
          </div>
        ) : (
          <StatCardItem
            key={stat.label + index}
            stat={stat}
            isLoading={isLoading}
          />
        ),
      )}
    </div>
  );
};

export default StatsCard;
export type { StatData, StatsCardProps, StatVariant, TrendDirection };
