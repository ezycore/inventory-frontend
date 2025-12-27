"use client";

import { ColumnDef } from "@tanstack/react-table";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { Badge } from "@/ui/components/badge";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";

// Hooks & API
import { queryKeys } from "@/lib/query-keys";
import { inventoryApi } from "@/lib/api-client";

// Shortlist item type
interface ShortlistItem {
  _id: string;
  product_name: string;
  variant_attributes: Record<string, any> | null;
  location_name: string;
  current_quantity: number;
  ideal_quantity: number;
  needed_quantity: number;
  is_low_stock: boolean;
  product_id: string;
  variant_id?: string | null;
  location_id: string;
  product?: any;
  variant?: any;
  location?: any;
}

// Column definitions for shortlist
const columns: ColumnDef<ShortlistItem>[] = [
  {
    accessorKey: "product_name",
    header: "Product",
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue("product_name")}</span>;
    },
  },
  {
    accessorKey: "variant_attributes",
    header: "Variant",
    cell: ({ row }) => {
      const attributes = row.getValue("variant_attributes") as Record<string, any> | null;
      if (!attributes) return <span className="text-muted-foreground">-</span>;
      
      const attrs = Object.entries(attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      return <span className="text-sm">{attrs}</span>;
    },
  },
  {
    accessorKey: "location_name",
    header: "Location",
    cell: ({ row }) => {
      return <span>{row.getValue("location_name")}</span>;
    },
  },
  {
    accessorKey: "current_quantity",
    header: "Current Qty",
    cell: ({ row }) => {
      const quantity = row.getValue("current_quantity") as number;
      const isLowStock = row.original.is_low_stock;
      return (
        <span className={isLowStock ? "text-red-600 font-semibold" : "font-medium"}>
          {quantity}
        </span>
      );
    },
  },
  {
    accessorKey: "quantity_alert",
    header: "Alert Qty",
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue("quantity_alert")}</span>;
    },
  },
  {
    accessorKey: "ideal_quantity",
    header: "Ideal Qty",
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue("ideal_quantity")}</span>;
    },
  },
  {
    accessorKey: "needed_quantity",
    header: "Needed Qty",
    cell: ({ row }) => {
      const needed = row.getValue("needed_quantity") as number;
      return (
        <Badge variant={needed > 0 ? "destructive" : "secondary"} className="font-semibold">
          {needed > 0 ? `+${needed}` : needed}
        </Badge>
      );
    },
  },
  {
    accessorKey: "is_low_stock",
    header: "Stock Status",
    cell: ({ row }) => {
      const isLowStock = row.getValue("is_low_stock");
      return isLowStock ? (
        <Badge variant="destructive">Low Stock</Badge>
      ) : (
        <Badge variant="default">Normal</Badge>
      );
    },
  },
];

// Filter configuration
const shortlistFilterConfig: FilterConfig = {
  fields: [
    {
      name: "location_id",
      label: "Location",
      type: "select",
      placeholder: "Select location",
      columnSpan: 1,
      optionsApi: "/locations",
    },
    {
      name: "product_id",
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
      options: [
        { label: "Low stock only", value: "true" },
      ],
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
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Inventory Shortlist"
        subTitle="View stock levels and identify items that need restocking by location"
      />

      <DataTable<ShortlistItem>
        cardTitle={(dataLength: number) => `Shortlist Items (${dataLength})`}
        columns={columns}
        filterConfig={shortlistFilterConfig}
        searchConfig={searchConfig}
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
