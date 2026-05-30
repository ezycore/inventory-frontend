import { formatCurrency } from "@/lib/currency";
import { SellOrderItem } from "@/services/stores";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { ColumnDef } from "@tanstack/react-table";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Editable number input that allows clearing and commits on blur/Enter
 */
function EditableNumberCell({
  value,
  min,
  max,
  fallback,
  onChange,
  className,
}: {
  value: number;
  min: number;
  max: number;
  fallback: number;
  onChange: (val: number) => void;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = () => {
    const num = Number(localValue);
    const clamped = isNaN(num) || localValue === "" ? fallback : Math.max(min, Math.min(max, num));
    onChange(clamped);
    setLocalValue(String(clamped));
  };

  return (
    <Input
      type="number"
      min={min}
      max={max}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
}

/**
 * Generate sales order columns with inline quantity/discount controls
 */
export const getSalesColumns = (
  onUpdateQuantity: (id: string, quantity: number) => void,
  onUpdateDiscount: (id: string, discount: number, price: number) => void,
  onRemove: (id: string) => void,
  currencySymbol?: string,
): ColumnDef<SellOrderItem>[] => [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div className="min-w-[100px]">
          <span className="font-medium text-sm">{row.original.productName}</span>
          {row.original.availableQuantity !== null && (
            <div className="text-xs text-muted-foreground">
              Available: {row.original.availableQuantity} {row.original.unitName || "units"}
            </div>
          )}
        </div>
      ),
    },
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
      accessorKey: "costPrice",
      header: "Cost Price",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.costPrice)}
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
            <EditableNumberCell
              value={item.quantity}
              min={1}
              max={item.availableQuantity ?? Number.MAX_SAFE_INTEGER}
              fallback={1}
              onChange={(val) => onUpdateQuantity(item.id, val)}
              className="h-7 w-12 text-center text-sm tabular-nums px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.availableQuantity !== null && item.quantity >= item.availableQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
            {item.unitName ? (
              <span className="ml-1 text-xs text-muted-foreground whitespace-nowrap">
                {item.unitName}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "discount",
      header: `Discount (${currencySymbol || ""})`,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <EditableNumberCell
            value={item.discount || 0}
            min={0}
            max={item.price}
            fallback={0}
            onChange={(val) => onUpdateDiscount(item.id, val, item.price)}
            className="h-7 w-16 text-center text-sm tabular-nums px-1"
          />
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