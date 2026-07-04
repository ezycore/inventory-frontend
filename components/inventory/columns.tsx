import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Inventory } from "@/types";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { AvatarCell } from "@/ui/components/dataTable/cells";
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
import { ExpiredBadge } from "@/components/shared/stock-qty";
import { getStockLevelInfo, getRestockInfo, getStockLevelLines } from "./helpers";

export const inventoryColumns: ColumnDef<Inventory>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      const attributes = row.original.attributes;
      const original = row.original as any;
      const imageUrl =
        original.images?.[0]?.thumbnailUrl;
      return (
        <div className="min-w-[180px]">
          <Link href={`/inventory/${original._id}`} className="block hover:underline">
            <AvatarCell
              imageUrl={imageUrl}
              name={row.original.name || "-"}
              fallbackIcon={Package}
              isActive={original.status === "active"}
            />
          </Link>
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
    header: "Stock Level",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const alertLevel = row.original.quantityAlert || 0;
      const { status, color, progressColor } = getStockLevelInfo(
        quantity,
        alertLevel
      );
      const maxDisplay = Math.max(alertLevel * 2, quantity, 100);
      const percentage = Math.min((quantity / maxDisplay) * 100, 100);
      const lines = getStockLevelLines(row.original as any);
      const baseUnitLabel = lines[0]?.text.split(" ").slice(1).join(" ") || "units";
      const unitName = row.original.unit?.shortName || "pcs";
      const expiredQuantity = row.original.expiredQuantity ?? 0;
      const sellableQuantity = row.original.sellableQuantity ?? quantity;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-1.5 min-w-[160px] cursor-help">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col leading-tight">
                  {lines.map((line, idx) => (
                    <span
                      key={`${line.hint}-${idx}`}
                      className={cn(
                        "tabular-nums",
                        idx === 0
                          ? cn("text-base font-bold", color)
                          : "text-[11px] text-muted-foreground"
                      )}
                    >
                      {idx === 0 ? line.text : `≈ ${line.text}`}
                      {idx > 0 && (
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          ({line.hint})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                  Alert: {alertLevel} {unitName}
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
              {expiredQuantity > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-emerald-600">
                    {sellableQuantity.toLocaleString()} sellable
                  </span>
                  <ExpiredBadge count={expiredQuantity} />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>Current: {quantity.toLocaleString()} {baseUnitLabel}</p>
              {expiredQuantity > 0 && (
                <>
                  <p>Sellable: {sellableQuantity.toLocaleString()} {baseUnitLabel}</p>
                  <p>Expired: {expiredQuantity.toLocaleString()} {baseUnitLabel}</p>
                </>
              )}
              <p>Alert Threshold: {alertLevel} {baseUnitLabel}</p>
              <p>Status: {status}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  // {
  //   accessorKey: "isLowStock",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const quantity = row.original.quantity || 0;
  //     const alertLevel = row.original.quantityAlert || 0;
  //     const { status, variant, bgColor, color } = getStockLevelInfo(
  //       quantity,
  //       alertLevel
  //     );

  //     return (
  //       <Badge
  //         variant={variant}
  //         className={cn(
  //           "gap-1 font-medium",
  //           variant === "secondary" && bgColor,
  //           variant === "secondary" && color,
  //           variant === "secondary" && "border"
  //         )}
  //       >
  //         {quantity === 0 ? (
  //           <PackageX className="h-3 w-3" />
  //         ) : quantity <= alertLevel ? (
  //           <AlertTriangle className="h-3 w-3" />
  //         ) : (
  //           <Package className="h-3 w-3" />
  //         )}
  //         {status}
  //       </Badge>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "restockStatus",
  //   header: "Restock",
  //   cell: ({ row }) => {
  //     const restockStatus = row.original.restockStatus || "normal";
  //     const { label, color, bgColor, icon: Icon } = getRestockInfo(
  //       restockStatus
  //     );

  //     return (
  //       <div
  //         className={cn(
  //           "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
  //           bgColor,
  //           color
  //         )}
  //       >
  //         <Icon className="h-3 w-3" />
  //         {label}
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: "stockValue",
    header: "Stock Value",
    cell: ({ row }) => {
      const quantity = row.original.quantity || 0;
      const price = row.original.price || 0;
      const stockValue = quantity * price;

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
                @৳{price.toFixed(2)} each
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>Quantity: {quantity.toLocaleString()}</p>
              <p>Price: {price.toFixed(2)}</p>
              <p>Total Value: ৳{stockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "costPrice",
    header: "Stock Value (Cost)",
    cell: ({ row }) => {
      const quantity = row.original.quantity || 0;
      const costPrice = row.original.costPrice || 0;
      const costValue = quantity * costPrice;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="min-w-[100px] cursor-help">
              <p className="text-sm font-semibold text-foreground">
                ৳{costValue.toLocaleString(undefined, {
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
              <p>Cost Price: {costPrice.toFixed(2)}</p>
              <p>Total Value: ৳{costValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </TooltipContent>
        </Tooltip>
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
