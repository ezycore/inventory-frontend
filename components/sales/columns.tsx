import { formatCurrency } from "@/lib/currency";
import { SellOrderItem } from "@/services/stores";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { ColumnDef } from "@tanstack/react-table";
import { Minus, Plus, Trash2 } from "lucide-react";

/**
 * Generate sales order columns with inline quantity/discount controls
 */
export const getSalesColumns = (
  onUpdateQuantity: (id: string, quantity: number) => void,
  onUpdateDiscount: (id: string, discountPercent: number) => void,
  onRemove: (id: string) => void,
): ColumnDef<SellOrderItem>[] => [
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <div className="min-w-[100px]">
        <span className="font-medium text-sm">{row.original.productName}</span>
        <div className="text-xs text-muted-foreground">
          Available: {row.original.availableQuantity}
        </div>
      </div>
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
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {formatCurrency(row.original.unitPrice)}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() =>
              onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
            }
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min={1}
            max={item.availableQuantity}
            value={item.quantity}
            onChange={(e) => {
              const val = Math.max(
                1,
                Math.min(item.availableQuantity, Number(e.target.value) || 1),
              );
              onUpdateQuantity(item.id, val);
            }}
            className="h-7 w-12 text-center text-sm tabular-nums px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.availableQuantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "discountValue",
    header: "Discount %",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            value={item.discountValue || 0}
            onChange={(e) => {
              const val = Math.max(
                0,
                Math.min(100, Number(e.target.value) || 0),
              );
              onUpdateDiscount(item.id, val);
            }}
            className="h-7 w-14 text-center text-sm tabular-nums px-1"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums">
        {formatCurrency(row.original.total)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(row.original.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    ),
  },
];