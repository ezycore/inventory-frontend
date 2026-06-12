"use client";

import { useMemo, useState, useCallback } from "react";
import PageHeader from "@/ui/components/header";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import { DataTable } from "@/ui/components/dataTable";
import {
  stockMovementsApi,
  useStockMovementStats,
} from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import {
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
} from "lucide-react";
import { QuickFilters, QuickFiltersResult } from "@/components/inventory/stock-movement/quick-filters";
import { ReasonChart } from "@/components/inventory/stock-movement/reason-chart";
import { columns } from "@/components/inventory/stock-movement/columns";


// ─── Page Component ──────────────────────────────────────────────────────────
export default function StockMovementsPage() {
  const [quickFilters, setQuickFilters] = useState<QuickFiltersResult>({});

  // Fetch aggregated stats from the API (respects quick filters)
  const { data: statsResponse, isLoading: isStatsLoading } =
    useStockMovementStats(quickFilters);

  const statsData = useMemo(
    () => statsResponse?.data || null,
    [statsResponse],
  );

  // Handle quick filter changes
  const handleQuickFilterChange = useCallback(
    (filters: QuickFiltersResult) => {
      setQuickFilters(filters);
    },
    [],
  );

  // Build table operations with quick filters merged
  const tableOperations = useMemo(
    () => ({
      getAllData: (params: any) =>
        stockMovementsApi.getAll({ ...params, ...quickFilters }),
      entityName: "Stock Movements",
      queryKey: [...queryKeys.stockMovements.all(), quickFilters],
    }),
    [quickFilters],
  );

  // Build stats cards from API data
  const stats: StatData[] = useMemo(() => {
    const s = statsData;
    const totalMovements = s?.totalMovements ?? 0;
    const inCount = s?.stockIn?.count ?? 0;
    const inQty = s?.stockIn?.quantity ?? 0;
    const outCount = s?.stockOut?.count ?? 0;
    const outQty = s?.stockOut?.quantity ?? 0;
    const netChange = s?.netChange ?? 0;

    return [
      {
        label: "Total Movements",
        value: totalMovements,
        icon: Activity,
        variant: "primary",
        description: "All tracked movements",
      },
      {
        label: "Stock In",
        value: `${inCount} (${inQty} units)`,
        icon: ArrowDownToLine,
        variant: "success",
      },
      {
        label: "Stock Out",
        value: `${outCount} (${outQty} units)`,
        icon: ArrowUpFromLine,
        variant: "destructive",
      },
      {
        label: "Net Change",
        value: `${netChange >= 0 ? "+" : ""}${netChange} units`,
        icon: ArrowUpDown,
        variant: netChange >= 0 ? "success" : "warning",
        trend: {
          value: netChange >= 0 ? "Stock growing" : "Stock decreasing",
          direction: netChange >= 0 ? "up" : "down",
        },
      },
    ];
  }, [statsData]);

  // Reason chart data from stats API
  const reasonChartData = useMemo(() => {
    if (!statsData?.reasonBreakdown) return [];
    return statsData.reasonBreakdown;
  }, [statsData]);

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <PageHeader
        title="Stock Movements"
        subTitle="Complete audit trail of all inventory changes"
      />

      {/* ── Stats ────────────────────────────────────────────────── */}
      <StatsCard
        data={stats}
        isLoading={isStatsLoading}
        columns={{ default: 2, lg: 4 }}
      />

      {/* ── Quick Filters + Reason Chart (same row) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <QuickFilters onChange={handleQuickFilterChange} />
        </div>
        <div className="lg:col-span-1">
          <ReasonChart data={reasonChartData} isLoading={isStatsLoading} />
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        selectable={false}
        searchConfig={{
          globalSearch: false,
        }}
        operations={tableOperations}
        enableSorting={true}
        enableRowHover={true}
        zebra={true}
      />
    </div>
  );
}
