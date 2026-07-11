"use client";
// coding-standard: maintained

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Progress } from "@/ui/components/progress";
import PageHeader from "@/ui/components/header";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import type { Translator } from "@/i18n/config";

// Hooks & API
import { queryKeys } from "@/services/api/query-keys";
import { inventoryApi, useDashboardStats } from "@/services/api";
import {
  AlertTriangle,
  AlertOctagon,
  Package,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { getInventoryFilterConfig } from "@/components/inventory/filters";

// Shortlist item type (flat structure from API)
interface ShortlistItem {
  _id: string;
  productId: string;
  variantId?: string;
  name: string;
  productType: string;
  attributes?: Record<string, any> | null;
  price?: number;
  costPrice?: number;
  enableUOMConversion?: boolean;
  unit?: { _id: string; name: string; shortName: string } | null;
  purchaseUnit?: {
    unitId?: { _id: string; name: string; shortName: string };
    conversionFactor?: number;
  };
  saleUnit?: {
    unitId?: { _id: string; name: string; shortName: string };
    conversionFactor?: number;
  };
  variant: { _id: string; attributes?: Record<string, any> | null; price?: number } | null;
  location: { _id: string; name: string } | null;
  quantity: number;
  quantityAlert: number;
  neededQuantity: number;
  isLowStock: boolean;
  restockStatus: string;
  categoryId?: string;
  brandId?: string;
  quantityBreakdown?: {
    enabled: boolean;
    purchaseUnitQuantity: number;
    purchaseUnitName: string;
    remainderQuantity: number;
    baseUnitName: string;
    conversionFactor: number;
    displayText: string;
  } | null;
}

/** Get display name: product name + variant attributes */
function getDisplayName(item: ShortlistItem, fallbackName: string): string {
  let name = item.name || fallbackName;
  if (item.variant?.attributes) {
    const attrs = Object.values(item.variant.attributes).join(", ");
    if (attrs) name = `${name} (${attrs})`;
  }
  return name;
}

/** Get base unit short name */
function getUnitShortName(item: ShortlistItem): string {
  return item.unit?.shortName || "pcs";
}

/** Format needed quantity with appropriate unit */
function getNeededQtyDisplay(item: ShortlistItem): string {
  const needed = item.quantityAlert - item.quantity + 1;
  if (needed <= 0) return `0 ${getUnitShortName(item)}`;

  // If purchaseUnit exists with unitId, show in purchase units
  if (item.purchaseUnit?.unitId && item.purchaseUnit.conversionFactor && item.purchaseUnit.conversionFactor > 1) {
    const purchaseQty = Math.ceil(needed / item.purchaseUnit.conversionFactor);
    return `${purchaseQty} ${item.purchaseUnit.unitId.shortName}`;
  }

  return `${needed} ${getUnitShortName(item)}`;
}

// Column definitions for shortlist with enhanced visuals
function getShortlistColumns(t: Translator): ColumnDef<ShortlistItem>[] {
  return [
    {
      accessorKey: "name",
      header: t("columns.product"),
      cell: ({ row }) => {
        const attributes = row.original.attributes;
        return (
          <div className="min-w-[180px]">
            <span className="font-medium">
              {getDisplayName(row.original, t("lowstock.unknownProduct"))}
            </span>
            {row.original.location?.name && (
              <div className="text-xs text-muted-foreground">{row.original.location.name}</div>
            )}
            {attributes && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(attributes).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: t("columns.stockLevel"),
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        const alertQty = row.original.quantityAlert || 1;
        const unitName = getUnitShortName(row.original);
        const ratio = Math.min((quantity / alertQty) * 100, 100);
        const isCritical = quantity === 0;

        const breakdown = row.original.quantityBreakdown;
        const saleUnitObj = row.original.saleUnit?.unitId;
        const saleFactor = Number(row.original.saleUnit?.conversionFactor || 0);
        const baseUnitId = row.original.unit?._id;
        const showSale =
          saleUnitObj &&
          saleFactor > 1 &&
          saleUnitObj._id &&
          saleUnitObj._id !== baseUnitId;
        const saleQty = showSale ? Math.floor(quantity / saleFactor) : 0;

        return (
          <div className="space-y-1 min-w-[140px]">
            <div className="flex items-start justify-between text-sm gap-2">
              <div className="flex flex-col leading-tight">
                <span
                  className={
                    isCritical
                      ? "text-destructive font-bold"
                      : "text-chart-1 font-semibold"
                  }
                >
                  {quantity} {unitName}
                </span>
                {breakdown?.enabled && (breakdown?.conversionFactor ?? 0) > 1 && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    ≈ {breakdown.displayText}
                    <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      ({t("stockLevel.hintPurchase")})
                    </span>
                  </span>
                )}
                {showSale && saleQty > 0 && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    ≈ {saleQty} {saleUnitObj?.shortName || saleUnitObj?.name}
                    <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      ({t("stockLevel.hintSale")})
                    </span>
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {t("lowstock.alertHint", { level: alertQty, unit: unitName })}
              </span>
            </div>
            <Progress
              value={ratio}
              className="h-1.5"
              indicatorClassName={
                isCritical
                  ? "bg-destructive"
                  : ratio < 50
                    ? "bg-chart-1"
                    : "bg-chart-2"
              }
            />
          </div>
        );
      },
    },
    {
      accessorKey: "neededQuantity",
      header: t("lowstock.colNeededQty"),
      cell: ({ row }) => {
        const { enableUOMConversion } = row.original;
        const neededQuantity = (row.original.quantityAlert as number) - (row.original.quantity as number) + 1;
        const unitLabel = getNeededQtyDisplay(row.original);
        const display = enableUOMConversion ? `${neededQuantity} ${getUnitShortName(row.original)} (${unitLabel})` : `${neededQuantity} ${getUnitShortName(row.original)}`;
        return (
          <Badge
            variant={neededQuantity > 0 ? "destructive" : "secondary"}
            className="font-semibold gap-1"
          >
            {neededQuantity > 0 && <TrendingDown className="h-3 w-3" />}
            {neededQuantity > 0 ? `+${display}` : display}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isLowStock",
      header: t("lowstock.colUrgency"),
      cell: ({ row }) => {
        const quantity = row.original.quantity || 0;
        const alertQty = row.original.quantityAlert || 1;
        const ratio = quantity / alertQty;

        if (quantity === 0) {
          return (
            <Badge
              variant="destructive"
              className="gap-1"
            >
              <AlertOctagon className="h-3 w-3" />
              {t("lowstock.urgencyCritical")}
            </Badge>
          );
        }
        if (ratio < 0.5) {
          return (
            <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t("lowstock.urgencyHigh")}
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("lowstock.urgencyMedium")}
          </Badge>
        );
      },
    },
  ];
}

export default function LowStock() {
  const t = useTranslations("inventory");
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<ShortlistItem[]>([]);
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats();
  const stats = dashboardData?.data;

  const columns = useMemo(() => getShortlistColumns(t), [t]);
  const filterConfig = useMemo(() => getInventoryFilterConfig(t), [t]);
  const searchConfig = useMemo(
    () => ({
      globalSearch: true,
      placeholder: t("lowstock.searchPlaceholder"),
    }),
    [t],
  );

  const handleSelectionChange = useCallback((rows: ShortlistItem[]) => {
    setSelectedItems(rows);
  }, []);

  const handleCreatePurchase = useCallback(() => {
    const ids = selectedItems.map((item) => item._id);
    sessionStorage.setItem("lowstock-import-ids", JSON.stringify(ids));
    router.push("/purchases");
  }, [selectedItems, router]);

  const shortlistStats: StatData[] = [
    {
      label: t("lowstock.statLowStock"),
      value: stats?.variants?.lowStock || 0,
      icon: AlertTriangle,
      variant: (stats?.variants?.lowStock || 0) > 0 ? "warning" : "success",
      description: t("lowstock.statLowStockDesc"),
    },
    {
      label: t("lowstock.statOutOfStock"),
      value: stats?.variants?.outOfStock || 0,
      icon: AlertOctagon,
      variant:
        (stats?.variants?.outOfStock || 0) > 0 ? "destructive" : "success",
      description: t("lowstock.statOutOfStockDesc"),
    },
    {
      label: t("lowstock.statTotalAlerts"),
      value: (stats?.variants?.lowStock || 0) + (stats?.variants?.outOfStock || 0),
      icon: Package,
      variant: "info",
      description: t("lowstock.statTotalAlertsDesc"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("lowstock.title")}
        subTitle={t("lowstock.subtitle")}
        actions={
          selectedItems.length > 0 ? (
            <Button onClick={handleCreatePurchase} className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              {t("lowstock.createPurchaseOrder")}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px] rounded-full">
                {selectedItems.length}
              </Badge>
            </Button>
          ) : undefined
        }
      />

      {/* Stats Row */}
      <StatsCard
        data={shortlistStats}
        isLoading={dashLoading}
        columns={{ default: 1, sm: 3 }}
      />

      <DataTable<ShortlistItem>
        cardTitle={(dataLength: number) => t("lowstock.itemsTitle", { count: dataLength })}
        columns={columns}
        filterConfig={filterConfig}
        searchConfig={searchConfig}
        enableSorting={true}
        enableRowHover={true}
        rowClassName={(row: ShortlistItem) =>
          row.quantity === 0
            ? "bg-destructive/5"
            : row.isLowStock
              ? "bg-chart-1/5"
              : ""
        }
        operations={{
          getAllData: (params: any) => inventoryApi.getShortlist(params),
          queryKey: [...queryKeys.inventory.list({})],
          entityName: t("lowstock.entity"),
        }}
        defaultPageSize={50}
        pageSizes={[10, 25, 50, 100]}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
