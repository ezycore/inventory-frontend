"use client";

import { ColumnDef } from "@tanstack/react-table";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { Badge } from "@/ui/components/badge";
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
  TrendingDown,
} from "lucide-react";

// Shortlist item type
interface ShortlistItem {
  _id: string;
  product: Record<string, any> | null;
  variant: Record<string, any> | null;
  location: Record<string, any> | null;
  quantity: number;
  quantityAlert: number;
  neededQuantity: number;
  isLowStock: boolean;
  restockStatus: string;
}

// Column definitions for shortlist with enhanced visuals
const columns: ColumnDef<ShortlistItem>[] = [
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      return (
        <span className="font-medium">{row.getValue("product")?.name}</span>
      );
    },
  },
  {
    accessorKey: "variant",
    header: "Variant",
    cell: ({ row }) => {
      const attributes = row.getValue("variant")?.attributes as Record<
        string,
        any
      > | null;
      if (!attributes)
        return <span className="text-muted-foreground">-</span>;

      const attrs = Object.entries(attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      return <span className="text-sm text-muted-foreground">{attrs}</span>;
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      return <span>{row.getValue("location")?.name}</span>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Stock Level",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const alertQty = row.original.quantityAlert || 1;
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
              {quantity}
            </span>
            <span className="text-xs text-muted-foreground">
              alert: {alertQty}
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
    accessorKey: "quantityAlert",
    header: "Alert Qty",
    cell: ({ row }) => {
      return (
        <span className="font-medium">{row.getValue("quantityAlert")}</span>
      );
    },
  },
  {
    accessorKey: "neededQuantity",
    header: "Needed Qty",
    cell: ({ row }) => {
      const needed = row.getValue("neededQuantity") as number;
      return (
        <Badge
          variant={needed > 0 ? "destructive" : "secondary"}
          className="font-semibold gap-1"
        >
          {needed > 0 && <TrendingDown className="h-3 w-3" />}
          {needed > 0 ? `+${needed}` : needed}
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

export default function ShortlistPage() {
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats();
  const stats = dashboardData?.data;

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
      value: stats?.stock?.lowStockAlerts || 0,
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
      />
    </div>
  );
}
