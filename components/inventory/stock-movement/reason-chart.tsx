"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DonutChart } from "@/ui/components/charts";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { useMovementReasonLabel } from "@/hooks/use-movement-reason-label";

interface ReasonBreakdown {
  reason: string;
  count: number;
}

interface ReasonChartProps {
  data: ReasonBreakdown[];
  isLoading?: boolean;
}

const reasonColors: Record<string, string> = {
  purchase: "var(--color-chart-2)",
  adjustment: "var(--color-chart-4)",
  opening_stock: "var(--color-primary)",
  sale: "var(--color-chart-1)",
  return: "var(--color-chart-5)",
  transfer: "var(--color-chart-3)",
  warranty_replacement: "var(--color-teal-600)",
};

export function ReasonChart({ data, isLoading }: ReasonChartProps) {
  const t = useTranslations("inventory");
  const reasonLabel = useMovementReasonLabel();
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: reasonLabel(item.reason),
      value: item.count,
      color: reasonColors[item.reason] || "var(--color-muted-foreground)",
    }));
  }, [data, reasonLabel]);

  if (isLoading) {
    return (
      <Card className="h-full p-5">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-48 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-[160px] w-[160px] rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="h-full p-5 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("movements.chartEmpty")}</p>
      </Card>
    );
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <DonutChart
      data={chartData}
      title={t("movements.chartTitle")}
      subtitle={t("movements.chartSubtitle")}
      height={160}
      innerRadius={45}
      outerRadius={70}
      showLegend={true}
      centerValue={total}
      centerLabel={t("movements.chartTotal")}
      className="h-full"
    />
  );
}
