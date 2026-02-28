"use client";

import { cn } from "@/ui/lib/utils";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Cell,
} from "recharts";
import { Card } from "../card";

interface BarChartDataItem {
  label: string;
  [key: string]: string | number;
}

interface BarChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  stackId?: string;
  radius?: number;
}

interface BarChartProps {
  data: BarChartDataItem[];
  series: BarChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  layout?: "vertical" | "horizontal";
  className?: string;
  tooltipFormatter?: (value: number) => string;
  wrapInCard?: boolean;
  barSize?: number;
  /** Use different colors per bar (for single-series categorical data) */
  colorPerBar?: string[];
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

const BarChartComponent = ({
  data,
  series,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showYAxis = false,
  showLegend = false,
  layout = "horizontal",
  className,
  tooltipFormatter,
  wrapInCard = true,
  barSize,
  colorPerBar,
}: BarChartProps) => {
  const isVertical = layout === "vertical";

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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 5,
            right: 5,
            left: isVertical ? 80 : showYAxis ? 0 : -20,
            bottom: 0,
          }}
          barSize={barSize}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/50"
              vertical={isVertical}
              horizontal={!isVertical}
            />
          )}
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={75}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              {showYAxis && (
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  width={50}
                />
              )}
            </>
          )}
          <Tooltip
            content={<CustomTooltip formatter={tooltipFormatter} />}
            cursor={{ className: "fill-muted/50" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {series.map((s, i) => {
            const color = s.color || defaultColors[i % defaultColors.length];
            return (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={color}
                stackId={s.stackId}
                radius={s.radius ?? 4}
              >
                {colorPerBar &&
                  data.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={colorPerBar[idx % colorPerBar.length]}
                    />
                  ))}
              </Bar>
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </>
  );

  if (!wrapInCard) return <div className={className}>{chartContent}</div>;

  return <Card className={cn("p-5", className)}>{chartContent}</Card>;
};

export default BarChartComponent;
export type { BarChartDataItem, BarChartProps, BarChartSeries };
