"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Progress } from "@/ui/components/progress";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";

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

// Shortlist item type (flat structure from API)
interface ShortlistItem {
  _id: string;
  productId: string;
  variantId?: string;
  name: string;
  productType: string;
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
function getDisplayName(item: ShortlistItem): string {
  let name = item.name || "Unknown Product";
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
  const needed = item.neededQuantity;
  if (needed <= 0) return `0 ${getUnitShortName(item)}`;

  // If purchaseUnit exists with unitId, show in purchase units
  if (item.purchaseUnit?.unitId && item.purchaseUnit.conversionFactor && item.purchaseUnit.conversionFactor > 1) {
    const purchaseQty = Math.ceil(needed / item.purchaseUnit.conversionFactor);
    return `${purchaseQty} ${item.purchaseUnit.unitId.shortName}`;
  }

  return `${needed} ${getUnitShortName(item)}`;
}

// Column definitions for shortlist with enhanced visuals
const columns: ColumnDef<ShortlistItem>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      return (
        <div>
          <span className="font-medium">{getDisplayName(row.original)}</span>
          {row.original.location?.name && (
            <div className="text-xs text-muted-foreground">{row.original.location.name}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Stock Level",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const alertQty = row.original.quantityAlert || 1;
      const unitName = getUnitShortName(row.original);
      const ratio = Math.min((quantity / alertQty) * 100, 100);
      const isCritical = quantity === 0;

      return (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex items-center justify-between text-sm">
            <span
              className={
                isCritical
                  ? "text-destructive font-bold"
                  : "text-chart-1 font-semibold"
              }
            >
              {quantity} {unitName}
            </span>
            <span className="text-xs text-muted-foreground">
              alert: {alertQty} ({unitName})
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
    header: "Needed Qty",
    cell: ({ row }) => {
      const { neededQuantity, enableUOMConversion } = row.original;
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
    header: "Urgency",
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
            Critical
          </Badge>
        );
      }
      if (ratio < 0.5) {
        return (
          <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 gap-1">
            <AlertTriangle className="h-3 w-3" />
            High
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Medium
        </Badge>
      );
    },
  },
];

// Filter configuration
const shortlistFilterConfig: FilterConfig = {
  fields: [
    {
      name: "locationId",
      label: "Location",
      type: "select",
      placeholder: "Select location",
      columnSpan: 1,
      optionsApi: "/locations",
    },
    {
      name: "productId",
      label: "Product",
      type: "select",
      placeholder: "All products",
      columnSpan: 1,
      optionsApi: "/products",
    },
    {
      name: "low_stock_only",
      label: "Stock Filter",
      type: "select",
      placeholder: "All items",
      columnSpan: 1,
      options: [{ label: "Low stock only", value: "true" }],
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search by product, variant, or location...",
};

export default function LowStock() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<ShortlistItem[]>([]);
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats();
  const stats = dashboardData?.data;

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
      label: "Low Stock Items",
      value: stats?.variants?.lowStock || 0,
      icon: AlertTriangle,
      variant: (stats?.variants?.lowStock || 0) > 0 ? "warning" : "success",
      description: "Below alert threshold",
    },
    {
      label: "Out of Stock",
      value: stats?.variants?.outOfStock || 0,
      icon: AlertOctagon,
      variant:
        (stats?.variants?.outOfStock || 0) > 0 ? "destructive" : "success",
      description: "Zero quantity - critical",
    },
    {
      label: "Total Alerts",
      value: (stats?.variants?.lowStock || 0) + (stats?.variants?.outOfStock || 0),
      icon: Package,
      variant: "info",
      description: "Across all locations",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Low Stock Products"
        subTitle="View stock levels and identify items that need restocking by location"
        actions={
          selectedItems.length > 0 ? (
            <Button onClick={handleCreatePurchase} className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Create Purchase Order
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
        cardTitle={(dataLength: number) => `Items (${dataLength})`}
        columns={columns}
        filterConfig={shortlistFilterConfig}
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
          entityName: "Shortlist Item",
        }}
        defaultPageSize={50}
        pageSizes={[10, 25, 50, 100]}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
