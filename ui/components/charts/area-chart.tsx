"use client";

import { cn } from "@/ui/lib/utils";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../card";

interface AreaChartDataItem {
  label: string;
  [key: string]: string | number;
}

interface AreaChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  fillOpacity?: number;
}

interface AreaChartProps {
  data: AreaChartDataItem[];
  series: AreaChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showYAxis?: boolean;
  className?: string;
  tooltipFormatter?: (value: number) => string;
  wrapInCard?: boolean;
}

const defaultColors = [
  "var(--color-primary)",
  "var(--color-chart-2)",
  "var(--color-chart-1)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const CustomTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const AreaChartComponent = ({
  data,
  series,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showYAxis = false,
  className,
  tooltipFormatter,
  wrapInCard = true,
}: AreaChartProps) => {
  const chartContent = (
    <>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 5, right: 5, left: showYAxis ? 0 : -20, bottom: 0 }}
        >
          <defs>
            {series.map((s, i) => {
              const color = s.color || defaultColors[i % defaultColors.length];
              return (
                <linearGradient
                  key={s.dataKey}
                  id={`gradient-${s.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/50"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          {showYAxis && (
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={50}
            />
          )}
          <Tooltip
            content={<CustomTooltip formatter={tooltipFormatter} />}
            cursor={{ className: "stroke-border" }}
          />
          {series.map((s, i) => {
            const color = s.color || defaultColors[i % defaultColors.length];
            return (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${s.dataKey})`}
                fillOpacity={s.fillOpacity ?? 1}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </>
  );

  if (!wrapInCard) return <div className={className}>{chartContent}</div>;

  return <Card className={cn("p-5", className)}>{chartContent}</Card>;
};

export default AreaChartComponent;
export type { AreaChartDataItem, AreaChartProps, AreaChartSeries };
