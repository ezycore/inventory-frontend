"use client";
// coding-standard: maintained

// Components & Configs
import { getInventoryColumns } from "@/components/inventory/columns";
import { getInventoryFilterConfig } from "@/components/inventory/filters";
import { getInventoryFormConfig, inventoryDefaultValues } from "@/components/inventory/form-config";
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
import { useCostGatedColumns } from "@/hooks/use-cost-gated-columns";
import { BarcodeInput } from "@/components/shared/barcode";
import { useAuthStore } from "@/services/stores";
import { useBarcodeLookupAction } from "@/services/api/modules/barcode";
import { toast } from "sonner";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats();
  const { format: formatCurrency } = useCurrency();
  const stats = dashboardData?.data;
  const barcodeEnabled = useAuthStore((s) => s.user?.organization?.features?.barcodeSystem);
  const expiryEnabled = useAuthStore(
    (s) => s.user?.organization?.features?.expiryTracking ?? false,
  );
  const lookupBarcode = useBarcodeLookupAction();
  const baseColumns = useMemo(() => getInventoryColumns(t), [t]);
  const columns = useCostGatedColumns(baseColumns);
  const filterConfig = useMemo(() => getInventoryFilterConfig(t), [t]);
  const formConfig = useMemo(() => getInventoryFormConfig(t), [t]);

  const handleBarcodeScan = async (code: string) => {
    try {
      const r = await lookupBarcode(code);
      if (!r.hasInventoryAtLocation) {
        toast.warning(t("stock.scanNoStock", { name: r.name }));
      } else {
        toast.success(
          t("stock.scanFound", {
            name: r.name,
            quantity: r.quantity,
            unit: r.unitName || "",
          }),
        );
      }
    } catch (err: any) {
      toast.error(err?.message || t("stock.scanNotFound", { code }));
    }
  };

  const kpiStats = getInventoryKpiStats(stats, formatCurrency, t);
  const summaryMetrics = getInventorySummaryMetrics(stats, formatCurrency, t);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("stock.title")}
        subTitle={t("stock.subtitle")}
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
            placeholder={t("stock.scanPlaceholder")}
          />
        </div>
      )}

      <DataTable
        cardTitle={(dataLength: number) => t("stock.itemsTitle", { count: dataLength })}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={filterConfig}
        columns={columns}
        selectable={true}
        enableSorting={true}
        enableRowHover={true}
        exportConfig={{
          download: (params) =>
            params.dataset === "batch"
              ? inventoryApi.exportBatchCsv(params)
              : inventoryApi.exportCsv(params),
          note: t("stock.exportNote"),
          options: [
            {
              key: "stock-all",
              label: t("stock.exportStockAll"),
              description: t("stock.exportStockAllDesc"),
            },
            {
              key: "stock-essential",
              label: t("stock.exportStockEssential"),
              description: t("stock.exportStockEssentialDesc"),
              params: { columns: "essential" },
            },
            // Batch/expiry rows — only when the org tracks expiry.
            ...(expiryEnabled
              ? [
                  {
                    key: "batch",
                    label: t("stock.exportBatch"),
                    description: t("stock.exportBatchDesc"),
                    params: { dataset: "batch" },
                  },
                ]
              : []),
          ],
        }}
        importConfig={{
          downloadTemplate: inventoryApi.downloadImportTemplate,
          preview: inventoryApi.importPreview,
          commit: inventoryApi.importCommit,
        }}
        rowClassName={(row: Inventory) =>
          row.quantity === 0
            ? "bg-destructive/5 border-l-2 border-l-destructive"
            : row.isLowStock
              ? "bg-chart-1/5 border-l-2 border-l-chart-1"
              : ""
        }
        operations={{
          formConfig,
          defaultValues: inventoryDefaultValues,
          getAllData: inventoryApi.getAll,
          disabledFieldsInEdit: ['productId', 'variantId'],
          createMutation: useCreateInventory(),
          updateMutation: useUpdateInventory(),
          deleteMutation: useDeleteInventory(),
          bulkDeleteMutation: useBulkDeleteInventory(),
          queryKey: queryKeys.inventory.all(),
          entityName: t("stock.entity"),
          prepareSubmitData: (data: Inventory, isEdit: boolean, item: Inventory) =>
            prepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
