"use client";

import { cn } from "@/ui/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "../card";

interface DonutChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartDataItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
  tooltipFormatter?: (value: number) => string;
  wrapInCard?: boolean;
}

const defaultColors = [
  "var(--color-primary)",
  "var(--color-chart-2)",
  "var(--color-chart-1)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-3)",
];

const CustomTooltip = ({
  active,
  payload,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: DonutChartDataItem;
  }>;
  formatter?: (value: number) => string;
}) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{
            backgroundColor:
              entry.payload.color ||
              defaultColors[0],
          }}
        />
        <span className="text-muted-foreground">{entry.name}:</span>
        <span className="font-semibold">
          {formatter
            ? formatter(entry.value)
            : entry.value.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

const DonutChart = ({
  data,
  title,
  subtitle,
  height = 250,
  innerRadius = 60,
  outerRadius = 90,
  className,
  showLegend = true,
  centerLabel,
  centerValue,
  tooltipFormatter,
  wrapInCard = true,
}: DonutChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartContent = (
    <>
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: outerRadius * 2 + 20, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color || defaultColors[index % defaultColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
            </PieChart>
          </ResponsiveContainer>
          {(centerLabel || centerValue) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {centerValue && (
                <span className="text-lg font-bold">{centerValue}</span>
              )}
              {centerLabel && (
                <span className="text-xs text-muted-foreground">{centerLabel}</span>
              )}
            </div>
          )}
        </div>
        {showLegend && (
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {data.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
              return (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        item.color || defaultColors[index % defaultColors.length],
                    }}
                  />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                  <span className="font-medium ml-auto">{percentage}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  if (!wrapInCard) return <div className={className}>{chartContent}</div>;

  return <Card className={cn("p-5", className)}>{chartContent}</Card>;
};

export default DonutChart;
export type { DonutChartDataItem, DonutChartProps };
