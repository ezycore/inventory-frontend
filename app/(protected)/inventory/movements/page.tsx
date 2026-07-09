"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  InventoryScopeFilter,
  type MovementScope,
} from "@/components/inventory/stock-movement/inventory-scope-filter";


// ─── Page Component ──────────────────────────────────────────────────────────
export default function StockMovementsPage() {
  const searchParams = useSearchParams();
  const [quickFilters, setQuickFilters] = useState<QuickFiltersResult>({});
  // Product/variant/location scope — seeded from the URL (deep links from the
  // product- and inventory-detail "View all" buttons) and driven by the fuse filter.
  const [scope, setScope] = useState<MovementScope>(() => ({
    productId: searchParams.get("productId") || undefined,
    variantId: searchParams.get("variantId") || undefined,
    locationId: searchParams.get("locationId") || undefined,
  }));

  // Quick (date/direction) filters + the inventory scope, merged for every query.
  const mergedFilters = useMemo(
    () => ({ ...quickFilters, ...scope }),
    [quickFilters, scope],
  );

  // Fetch aggregated stats from the API (respects all active filters)
  const { data: statsResponse, isLoading: isStatsLoading } =
    useStockMovementStats(mergedFilters);

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

  // Build table operations with all active filters merged
  const tableOperations = useMemo(
    () => ({
      getAllData: (params: any) =>
        stockMovementsApi.getAll({ ...params, ...mergedFilters }),
      entityName: "Stock Change",
      queryKey: [...queryKeys.stockMovements.all(), mergedFilters],
    }),
    [mergedFilters],
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
        title="Stock History"
        subTitle="Every stock change, recorded automatically."
      />

      {/* ── Stats ────────────────────────────────────────────────── */}
      <StatsCard
        data={stats}
        isLoading={isStatsLoading}
        columns={{ default: 2, lg: 4 }}
      />

      {/* ── Inventory (product/variant) scope filter ─────────────── */}
      <InventoryScopeFilter value={scope} onChange={setScope} />

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
