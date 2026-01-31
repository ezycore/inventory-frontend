"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/ui/components/badge";
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import PageHeader from "@/ui/components/header";
import { stockMovementsApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { FilterConfig } from "@/types/DataTable";
import { ArrowUp, ArrowDown, Package } from "lucide-react";

// Movement type badge
const MovementTypeBadge = ({ type }: { type: string }) => {
  const isIn = type === "in";
  return (
    <Badge variant={isIn ? "default" : "destructive"} className="gap-1">
      {isIn ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {type.toUpperCase()}
    </Badge>
  );
};

// Reason badge with color coding
const ReasonBadge = ({ reason }: { reason: string }) => {
  const variants: Record<string, any> = {
    purchase: "default",
    adjustment: "secondary",
    opening_stock: "outline",
    sale: "destructive",
    return: "default",
    transfer: "secondary",
  };

  return (
    <Badge variant={variants[reason] || "secondary"}>
      {reason.replace(/_/g, " ").toUpperCase()}
    </Badge>
  );
};

// Column definitions
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "productId",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.productId;
      return product?.name || product || "-";
    },
  },
  {
    accessorKey: "variantId",
    header: "Variant",
    cell: ({ row }) => {
      const variant = row.original.variantId;
      if (!variant) return "-";
      
      // Display variant attributes if available
      if (variant.attributes) {
        const attrs = Object.entries(variant.attributes)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        return attrs || variant.sku || "-";
      }
      return variant.sku || variant;
    },
  },
  {
    accessorKey: "locationId",
    header: "Location",
    cell: ({ row }) => {
      const location = row.original.locationId;
      return location?.name || location || "-";
    },
  },
  {
    accessorKey: "movementType",
    header: "Type",
    cell: ({ row }) => (
      <MovementTypeBadge type={row.getValue("movementType")} />
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <ReasonBadge reason={row.getValue("reason")} />,
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const type = row.original.movementType;
      return (
        <span className={type === "in" ? "text-green-600" : "text-red-600"}>
          {type === "in" ? "+" : "-"}
          {quantity}
        </span>
      );
    },
  },
  {
    accessorKey: "previousQuantity",
    header: "Previous",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue("previousQuantity")}
      </span>
    ),
  },
  {
    accessorKey: "newQuantity",
    header: "New",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("newQuantity")}</span>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;
      return notes ? (
        <span className="text-sm text-muted-foreground">{notes}</span>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const user = row.original.createdBy;
      return user?.name || user?.email || "-";
    },
  },
];

// Filter configuration
const filterConfig: FilterConfig = {
  fields: [
    {
      name: "reason",
      label: "Reason",
      type: "select",
      placeholder: "All reasons",
      columnSpan: 1,
      options: [
        { label: "Purchase", value: "purchase" },
        { label: "Adjustment", value: "adjustment" },
        { label: "Opening Stock", value: "opening_stock" },
        { label: "Sale", value: "sale" },
        { label: "Return", value: "return" },
        { label: "Transfer", value: "transfer" },
      ],
    },
    {
      name: "movementType",
      label: "Movement Type",
      type: "select",
      placeholder: "All types",
      columnSpan: 1,
      options: [
        { label: "In", value: "in" },
        { label: "Out", value: "out" },
      ],
    },
    {
      name: "productId",
      label: "Product",
      type: "select",
      placeholder: "Select product",
      columnSpan: 1,
      options: [],
    },
    {
      name: "locationId",
      label: "Location",
      type: "select",
      placeholder: "Select location",
      columnSpan: 1,
      options: [],
    },
    {
      name: "start_date",
      label: "Start Date",
      type: "date",
      placeholder: "Select start date",
      columnSpan: 1,
    },
    {
      name: "end_date",
      label: "End Date",
      type: "date",
      placeholder: "Select end date",
      columnSpan: 1,
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

export default function StockMovementsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Stock Movements"
        subTitle="Complete audit trail of all inventory changes"
      />

      {/* Movements List */}
      <DataTable
        cardTitle={(dataLength: number) => `Stock Movements (${dataLength})`}
        columns={columns}
        selectable={false}
        searchConfig={{
          globalSearch: false,
        }}
        filterConfig={filterConfig}
        operations={{
          getAllData: stockMovementsApi.getAll,
          entityName: "Stock Movements",
          queryKey: [...queryKeys.stockMovements.all()],
        }}
        enableSorting={true}
        enableRowHover={true}
      />
    </div>
  );
}
