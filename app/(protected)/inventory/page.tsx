"use client";

// Components & Configs
import { inventoryColumns } from "@/components/inventory/columns";
import { inventoryFilterConfig, inventorySearchConfig } from "@/components/inventory/filters";
import { inventoryFormConfig, inventoryDefaultValues } from "@/components/inventory/form-config";
import { prepareSubmitData } from "@/components/inventory/helpers";
import { getInventoryKpiStats, getInventorySummaryMetrics } from "@/components/inventory/stats";

// Types
import type { Inventory } from "@/types";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";
import SummaryBanner from "@/ui/components/SummaryBanner";
import { SparkLine } from "@/ui/components/charts";

// Hooks & API
import {
  useCreateInventory,
  useDeleteInventory,
  useUpdateInventory,
  useBulkDeleteInventory,
  useDashboardStats,
} from "@/services/api";
import { inventoryApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { useCurrency } from "@/lib/currency";
import { BarcodeInput } from "@/components/shared/barcode";
import { useAuthStore } from "@/services/stores";
import { useBarcodeLookupAction } from "@/services/api/modules/barcode";
import { toast } from "sonner";

export default function InventoryPage() {
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats();
  const { format: formatCurrency } = useCurrency();
  const stats = dashboardData?.data;
  const barcodeEnabled = useAuthStore((s) => s.user?.organization?.features?.barcodeSystem);
  const lookupBarcode = useBarcodeLookupAction();

  const handleBarcodeScan = async (code: string) => {
    try {
      const r = await lookupBarcode(code);
      if (!r.hasInventoryAtLocation) {
        toast.warning(`${r.name}: no stock at this location`);
      } else {
        toast.success(`${r.name} — qty ${r.quantity} ${r.unitName || ""}`);
      }
    } catch (err: any) {
      toast.error(err?.message || `No product found for "${code}"`);
    }
  };

  const kpiStats = getInventoryKpiStats(stats, formatCurrency);
  const summaryMetrics = getInventorySummaryMetrics(stats, formatCurrency);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Inventory Management"
        subTitle="Track stock levels, monitor alerts, and manage inventory."
      />

      {/* Quick Summary Banner */}
      <SummaryBanner
        metrics={summaryMetrics}
        isLoading={dashLoading}
        chart={
          <SparkLine
            data={[12, 19, 8, 15, 22, 18, 25, 20, 28, 24, 30, 27]}
            color="var(--color-primary)"
            width={120}
            height={50}
            filled
          />
        }
      />

      {/* KPI Stats Cards */}
      <StatsCard
        data={kpiStats}
        isLoading={dashLoading}
        columns={{ default: 2, lg: 4 }}
      />

      {barcodeEnabled && (
        <div className="rounded-md border bg-card p-3">
          <BarcodeInput
            onScan={handleBarcodeScan}
            placeholder="Scan a barcode to check stock at this location…"
          />
        </div>
      )}

      <DataTable
        cardTitle={(dataLength: number) => `Inventory Items (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={inventoryFilterConfig}
        columns={inventoryColumns}
        selectable={true}
        // searchConfig={inventorySearchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ 
          costPrice: false 
        }}
         searchConfig={{
            globalSearch: true,
            placeholder: "Search products by name...",
          }}
        enableRowHover={true}
        rowClassName={(row: Inventory) =>
          row.quantity === 0
            ? "bg-destructive/5 border-l-2 border-l-destructive"
            : row.isLowStock
              ? "bg-chart-1/5 border-l-2 border-l-chart-1"
              : ""
        }
        operations={{
          formConfig: inventoryFormConfig,
          defaultValues: inventoryDefaultValues,
          getAllData: inventoryApi.getAll,
          disabledFieldsInEdit: ['productId', 'variantId'],
          createMutation: useCreateInventory(),
          updateMutation: useUpdateInventory(),
          deleteMutation: useDeleteInventory(),
          bulkDeleteMutation: useBulkDeleteInventory(),
          queryKey: [...queryKeys.inventory.all()],
          entityName: "Inventory",
          prepareSubmitData: (data: Inventory, isEdit: boolean, item: Inventory) =>
            prepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
