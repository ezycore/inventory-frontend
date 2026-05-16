"use client";

import { cn } from "@/ui/lib/utils";
import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  filled?: boolean;
  strokeWidth?: number;
  className?: string;
}

const SparkLine = ({
  data,
  color = "var(--color-primary)",
  height = 32,
  width = 80,
  filled = true,
  strokeWidth = 1.5,
  className,
}: SparkLineProps) => {
  const id = useId();
  if (!data || data.length === 0) return null;

  const chartData = data.map((value, index) => ({ index, value }));
  const gradientId = `spark-gradient-${id.replace(/:/g, '')}`;

  return (
    <div className={cn("inline-flex items-center", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={filled ? `url(#${gradientId})` : "none"}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparkLine;
export type { SparkLineProps };
