"use client";
// coding-standard: maintained

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { getMovementColumns } from "@/components/inventory/stock-movement/columns";
import {
  InventoryScopeFilter,
  type MovementScope,
} from "@/components/inventory/stock-movement/inventory-scope-filter";


// ─── Page Component ──────────────────────────────────────────────────────────
export default function StockMovementsPage() {
  const t = useTranslations("inventory");
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
      entityName: t("movements.entity"),
      queryKey: [...queryKeys.stockMovements.all(), mergedFilters],
    }),
    [mergedFilters, t],
  );

  const columns = useMemo(() => getMovementColumns(t), [t]);

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
        label: t("movements.statTotal"),
        value: totalMovements,
        icon: Activity,
        variant: "primary",
        description: t("movements.statTotalDesc"),
      },
      {
        label: t("movements.statIn"),
        value: t("movements.countWithUnits", { count: inCount, quantity: inQty }),
        icon: ArrowDownToLine,
        variant: "success",
      },
      {
        label: t("movements.statOut"),
        value: t("movements.countWithUnits", { count: outCount, quantity: outQty }),
        icon: ArrowUpFromLine,
        variant: "destructive",
      },
      {
        label: t("movements.statNet"),
        value: t("movements.unitsValue", { value: `${netChange >= 0 ? "+" : ""}${netChange}` }),
        icon: ArrowUpDown,
        variant: netChange >= 0 ? "success" : "warning",
        trend: {
          value: netChange >= 0 ? t("movements.trendGrowing") : t("movements.trendDecreasing"),
          direction: netChange >= 0 ? "up" : "down",
        },
      },
    ];
  }, [statsData, t]);

  // Reason chart data from stats API
  const reasonChartData = useMemo(() => {
    if (!statsData?.reasonBreakdown) return [];
    return statsData.reasonBreakdown;
  }, [statsData]);

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <PageHeader
        title={t("movements.title")}
        subTitle={t("movements.subtitle")}
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
        operations={tableOperations}
        enableSorting={true}
        enableRowHover={true}
        zebra={true}
      />
    </div>
  );
}
