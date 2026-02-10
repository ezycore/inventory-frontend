import { formatCurrency } from "@/lib/currency";
import { SellOrderItem } from "@/services/stores"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const salesColumns: ColumnDef<SellOrderItem>[] = [
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.productName}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => row.original.quantity,
  },
  {
    accessorKey: "costPrice",
    header: "Cost Price",
    cell: ({ row }) => formatCurrency(row.original.costPrice),
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => formatCurrency(row.original.unitPrice),
  },
  {
    accessorKey: "discountAmount",
    header: "Discount",
    cell: ({ row }) => formatCurrency(row.original.discountAmount),
  },
  {
    accessorKey: "salePrice",
    header: "Sale Price",
    cell: ({ row }) => formatCurrency(row.original.salePrice),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.original.total)}
      </span>
    ),
  }
];