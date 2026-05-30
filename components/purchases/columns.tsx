import type { PurchaseOrderItem } from "@/services/stores";
import { Button } from "@/ui/components/button";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";

/**
 * Generate purchase order columns with edit/remove actions
 */
export const getPurchaseColumns = (
  onEdit: (sellerId: string, item: PurchaseOrderItem) => void,
  onRemove: (sellerId: string, itemId: string) => void,
  formatCurrency: (amount: number) => string,
  sellerId: string,
): ColumnDef<PurchaseOrderItem>[] => {
  const columns: ColumnDef<PurchaseOrderItem>[] = [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.productName}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => {
        return (
        <span className="text-sm tabular-nums">
          {row.original.quantity}
          {row.original.purchaseUnitName || row.original.unitName ? (
            <span className="ml-1 text-xs text-muted-foreground">
              {row.original.purchaseUnitName || row.original.unitName}
            </span>
          ) : null}
        </span>
      )
      },
    },
  ];

  columns.push(
    {
      accessorKey: "price",
      header: "Price (MRP)",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.discount)}
        </span>
      ),
    },
    {
      accessorKey: "costPrice",
      header: "Cost Price",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.costPrice)}
        </span>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.total)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-600/10"
            onClick={() => onEdit(sellerId, row.original)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(sellerId, row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  );

  return columns;
};
