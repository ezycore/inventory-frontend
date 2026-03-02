import { ColumnDef } from "@tanstack/react-table";
import { Inventory } from "@/types";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { Badge } from "@/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import {
  Package,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { getStockLevelInfo, getRestockInfo } from "./helpers";

export const inventoryColumns: ColumnDef<Inventory>[] = [
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.product;
      const variant = row.original.variant;
      return (
        <div className="min-w-[180px]">
          <div className="font-medium text-foreground">
            {product ? product.name : "-"}
          </div>
          {variant && variant.attributes && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(variant.attributes).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
          {variant?.sku && (
            <p className="text-xs text-muted-foreground mt-0.5">
              SKU: {variant.sku}
            </p>
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
      const quantityBreakdown = row.original.quantityBreakdown as Inventory["quantityBreakdown"];
      const alertLevel = row.original.quantityAlert || 0;
      const { status, color, progressColor } = getStockLevelInfo(
        quantity,
        alertLevel
      );
      const maxDisplay = Math.max(alertLevel * 2, quantity, 100);
      const percentage = Math.min((quantity / maxDisplay) * 100, 100);

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-1.5 min-w-[140px] cursor-help">
              <div className="flex items-center justify-between">
                <span className={cn("text-lg font-bold tabular-nums", color)}>
                  {quantity.toLocaleString()} {quantityBreakdown && <span className="text-xs text-muted-foreground ml-1">{quantityBreakdown.displayText}</span>}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Alert: {alertLevel}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    progressColor
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className={cn("text-[10px] font-medium", color)}>{status}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>Current: {quantity.toLocaleString()} units</p>
              <p>Alert Threshold: {alertLevel} units</p>
              <p>Status: {status}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "isLowStock",
    header: "Status",
    cell: ({ row }) => {
      const quantity = row.original.quantity || 0;
      const alertLevel = row.original.quantityAlert || 0;
      const { status, variant, bgColor, color } = getStockLevelInfo(
        quantity,
        alertLevel
      );

      return (
        <Badge
          variant={variant}
          className={cn(
            "gap-1 font-medium",
            variant === "secondary" && bgColor,
            variant === "secondary" && color,
            variant === "secondary" && "border"
          )}
        >
          {quantity === 0 ? (
            <PackageX className="h-3 w-3" />
          ) : quantity <= alertLevel ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <Package className="h-3 w-3" />
          )}
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "restockStatus",
    header: "Restock",
    cell: ({ row }) => {
      const restockStatus = row.original.restockStatus || "normal";
      const { label, color, bgColor, icon: Icon } = getRestockInfo(
        restockStatus
      );

      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
            bgColor,
            color
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </div>
      );
    },
  },
  {
    accessorKey: "stockValue",
    header: "Stock Value",
    cell: ({ row }) => {
      const quantity = row.original.quantity || 0;
      const costPrice = row.original.costPrice || 0;
      const stockValue = quantity * costPrice;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="min-w-[100px] cursor-help">
              <p className="text-sm font-semibold text-foreground">
                ৳{stockValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-[10px] text-muted-foreground">
                @৳{costPrice.toFixed(2)} each
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>Quantity: {quantity.toLocaleString()}</p>
              <p>Cost Price: ৳{costPrice.toFixed(2)}</p>
              <p>Total Value: ৳{stockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "costPrice",
    header: "Unit Cost",
    cell: ({ row }) => {
      const costPrice = row.original.costPrice || 0;
      return (
        <span className="text-sm font-medium tabular-nums">
          ৳{costPrice.toFixed(2)}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Active",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status === "active" ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];
