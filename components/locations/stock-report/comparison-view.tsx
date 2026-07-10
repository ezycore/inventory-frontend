"use client";
// coding-standard: maintained

import { cn } from "@/ui/lib/utils";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import type { LocationStockSummary } from "@/services/api/modules/locations/stock-report-api";
import { BarChart3, Boxes, DollarSign, Store, Warehouse } from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";

export function ComparisonView({
  summaries,
  isLoading,
}: {
  summaries: LocationStockSummary[];
  isLoading: boolean;
}) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No locations to compare.
      </div>
    );
  }

  // Find max values for relative bar widths
  const maxValue = Math.max(...summaries.map((s) => s.totalValue), 1);
  const maxQty = Math.max(...summaries.map((s) => s.totalQuantity), 1);

  return (
    <div className="space-y-6">
      {/* Value Comparison — cost-derived, costs.view only */}
      {canViewCosts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-500" />
              Stock Value Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaries.map((loc) => {
              const pct = (loc.totalValue / maxValue) * 100;
              return (
                <div key={loc.locationId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {loc.locationType === "warehouse" ? (
                        <Warehouse className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Store className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      <span className="font-medium">{loc.locationName}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums font-medium">
                      ৳{loc.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quantity Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Boxes className="h-4 w-4 text-blue-500" />
            Stock Quantity Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries.map((loc) => {
            const pct = (loc.totalQuantity / maxQty) * 100;
            return (
              <div key={loc.locationId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {loc.locationType === "warehouse" ? (
                      <Warehouse className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Store className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span className="font-medium">{loc.locationName}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums font-medium">
                    {loc.totalQuantity.toLocaleString()} units
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Stock Health Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Stock Health Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Location
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    Total Items
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    In Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-amber-600 dark:text-amber-400">
                    Low Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-red-600 dark:text-red-400">
                    Out of Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaries.map((loc) => {
                  const total =
                    loc.inStockCount + loc.lowStockCount + loc.outOfStockCount;
                  const health =
                    total > 0
                      ? Math.round((loc.inStockCount / total) * 100)
                      : 0;
                  const healthColor =
                    health >= 70
                      ? "text-emerald-600 dark:text-emerald-400"
                      : health >= 40
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400";

                  return (
                    <tr
                      key={loc.locationId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-sm font-medium">
                        {loc.locationName}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {loc.locationType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right">
                        {loc.totalProducts}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {loc.inStockCount}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-medium text-amber-600 dark:text-amber-400">
                        {loc.lowStockCount}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-medium text-red-600 dark:text-red-400">
                        {loc.outOfStockCount}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            healthColor,
                          )}
                        >
                          {health}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
