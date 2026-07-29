// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Inventory } from "@/types";
import type { Translator } from "@/i18n/config";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { AvatarCell } from "@/ui/components/dataTable/cells";
import { Badge } from "@/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { Package } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { getStockLevelInfo, getStockLevelLines } from "./helpers";
import { RestockBadge } from "./restock-badge";

/** Hint slug ("base" | "purchase" | "sale") → inventory.stockLevel.hint* key. */
const hintKey = (hint: string) =>
  `stockLevel.hint${hint.charAt(0).toUpperCase()}${hint.slice(1)}`;

/** Column defs for the current-stock table. `t` is bound to the `inventory` namespace. */
export function getInventoryColumns(t: Translator): ColumnDef<Inventory>[] {
  return [
    {
      accessorKey: "name",
      header: t("columns.product"),
      cell: ({ row }) => {
        const attributes = row.original.attributes;
        const original = row.original as any;
        const imageUrl = original.images?.[0]?.thumbnailUrl;
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
            <RestockBadge
              restockStatus={row.original.restockStatus}
              label={t("restock.ordered")}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: t("columns.stockLevel"),
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        const alertLevel = row.original.quantityAlert || 0;
        const { statusKey, color, progressColor } = getStockLevelInfo(
          quantity,
          alertLevel
        );
        const statusLabel = t(`stockLevel.${statusKey}`);
        // Bar fills relative to the alert threshold: at/above alert = full, drains to empty at 0.
        const percentage =
          alertLevel > 0
            ? Math.min((quantity / alertLevel) * 100, 100)
            : quantity > 0
              ? 100
              : 0;
        const lines = getStockLevelLines(row.original as any);
        const baseUnitLabel =
          lines[0]?.text.split(" ").slice(1).join(" ") || t("shared.unitsFallback");
        const unitName = row.original.unit?.shortName || "pcs";

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
                            ({t(hintKey(line.hint))})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    {t("columns.alert", { level: alertLevel, unit: unitName })}
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
                <p className={cn("text-[10px] font-medium", color)}>{statusLabel}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>{t("columns.tooltipCurrent", { quantity: quantity.toLocaleString(), unit: baseUnitLabel })}</p>
                <p>{t("columns.tooltipAlertThreshold", { level: alertLevel, unit: baseUnitLabel })}</p>
                <p>{t("columns.tooltipStatus", { status: statusLabel })}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "stockValue",
      header: t("columns.stockValue"),
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
                  {t("columns.eachAt", { price: `৳${price.toFixed(2)}` })}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>{t("columns.tooltipQuantity", { quantity: quantity.toLocaleString() })}</p>
                <p>{t("columns.tooltipPrice", { price: price.toFixed(2) })}</p>
                <p>{t("columns.tooltipTotalValue", { value: `৳${stockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` })}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "costPrice",
      header: t("columns.stockValueCost"),
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
                  {t("columns.eachAt", { price: `৳${costPrice.toFixed(2)}` })}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>{t("columns.tooltipQuantity", { quantity: quantity.toLocaleString() })}</p>
                <p>{t("columns.tooltipCostPrice", { price: costPrice.toFixed(2) })}</p>
                <p>{t("columns.tooltipTotalValue", { value: `৳${costValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` })}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("columns.active"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? t("columns.statusActive") : t("columns.statusInactive")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: t("columns.lastUpdated"),
      cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
    },
  ];
}
