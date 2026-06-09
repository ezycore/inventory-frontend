"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  Package,
} from "lucide-react";
import { CopyField } from "@/ui/components/copy";

// ─── Movement Type Badge ─────────────────────────────────────────────────────
const MovementTypeBadge = ({ type }: { type: string }) => {
  const isIn = type === "in";
  return (
    <Badge
      variant={isIn ? "default" : "destructive"}
      className="gap-1 text-xs font-medium"
    >
      {isIn ? (
        <ArrowDownToLine className="h-3 w-3" />
      ) : (
        <ArrowUpFromLine className="h-3 w-3" />
      )}
      {isIn ? "IN" : "OUT"}
    </Badge>
  );
};

// ─── Reason Badge ────────────────────────────────────────────────────────────
const ReasonBadge = ({ reason }: { reason: string }) => {
  const styles: Record<string, string> = {
    purchase: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    adjustment: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    opening_stock: "bg-primary/10 text-primary border-primary/20",
    sale: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    return: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    transfer: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  };

  return (
    <Badge variant="outline" className={`text-xs ${styles[reason] || ""}`}>
      {reason.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
    </Badge>
  );
};

// ─── Quantity Change Cell ────────────────────────────────────────────────────
const QuantityChangeCell = ({
  previous,
  current,
  type,
  quantity,
  unitLabel,
}: {
  previous: number;
  current: number;
  type: string;
  quantity: number;
  unitLabel?: string;
}) => {
  const isIn = type === "in";
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm tabular-nums">
        {previous}
      </span>
      <span className="text-muted-foreground/50">→</span>
      <span className="font-semibold text-sm tabular-nums">{current}</span>
      <Badge
        variant="outline"
        className={`text-xs font-semibold tabular-nums ${isIn
            ? "text-chart-2 border-chart-2/30 bg-chart-2/10"
            : "text-destructive border-destructive/30 bg-destructive/10"
          }`}
      >
        {isIn ? "+" : "-"}
        {quantity}
        {unitLabel ? (
          <span className="ml-1 font-normal opacity-80">{unitLabel}</span>
        ) : null}
      </Badge>
    </div>
  );
};

// ─── Column Definitions ──────────────────────────────────────────────────────
export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <DateCell
          value={row.getValue("createdAt")}
          isShowDateOnly={false}
        />
      </div>
    ),
  },
  {
    accessorKey: "productId",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.productId;
      const variant = row.original.variantId;
      return (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {product?.name || product || "-"}
            </p>
            {variant && (
              <p className="text-xs text-muted-foreground truncate">
                {variant.attributes
                  ? Object.entries(variant.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")
                  : ""}
              </p>
            )}
          </div>
        </div>
      );
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
    header: "Qty Change",
    cell: ({ row }) => {
      const product = row.original.productId as
        | { unitId?: { name?: string; shortName?: string } }
        | undefined;
      const unitLabel =
        product?.unitId?.shortName || product?.unitId?.name || undefined;
      return (
        <QuantityChangeCell
          previous={row.original.previousQuantity}
          current={row.original.newQuantity}
          type={row.original.movementType}
          quantity={row.getValue("quantity") as number}
          unitLabel={unitLabel}
        />
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;
      const id = (notes || "").match(/(?:INV|PO)-\d+-\d+/i)?.[0]

      return notes ? (
        <div className="flex items-center gap-1 max-w-[200px]">
          <span className="text-xs text-muted-foreground truncate block">
            {notes}
          </span>
          <CopyField value={id || notes} showValue={false} />
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "By",
    cell: ({ row }) => {
      const user = row.original.createdBy;
      return (
        <span className="text-sm text-muted-foreground">
          {user?.name || user?.email || "-"}
        </span>
      );
    },
  },
];
