"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Minus, Plus } from "lucide-react";

import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { NumberField } from "@/ui/components/number-field";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import type { PurchaseReturn } from "@/types";
import type { ReturnableItem } from "./types";
import { calculateMaxRefund } from "./helpers";
import { CopyField } from "@/ui/components/copy";

// =====================
// Status Badge
// =====================

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
          Processed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">
          Pending
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// =====================
// Returns Table Columns
// =====================

export function getReturnsColumns(
  formatCurrency: (n: number) => string,
  _isAccountsEnabled: boolean,
  onViewDetails?: (ret: PurchaseReturn) => void,
): ColumnDef<PurchaseReturn>[] {
  return [
    {
      accessorKey: "returnNumber",
      header: "Return ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-primary font-medium">
          <CopyField value={row.original.returnNumber} />
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      accessorKey: "orderNumber",
      header: "Invoice",
      cell: ({ row }) => {
        const { purchaseOrderId, orderNumber } = row.original;
        const display =
          typeof purchaseOrderId === "object" && purchaseOrderId?.orderNumber
            ? purchaseOrderId.orderNumber
            : orderNumber || String(purchaseOrderId);
        return (
          <span className="font-mono text-sm text-primary"><CopyField value={display} /></span>
        );
      },
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const sup =
          (row.original.supplier as { name?: string } | undefined) ||
          (row.original.supplierId as unknown as { name?: string } | undefined);
        if (sup && typeof sup === "object" && sup.name) {
          return <span className="text-sm">{sup.name}</span>;
        }
        return <span className="text-sm text-muted-foreground">Unknown</span>;
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-center">
          {row.original.items?.length ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "totalRefundAmount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.totalRefundAmount ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-sm capitalize">
          {row.original.reason?.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    ...(onViewDetails
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: PurchaseReturn } }) => (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="View Details"
                onClick={() => onViewDetails(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          } satisfies ColumnDef<PurchaseReturn>,
        ]
      : []),
  ];
}

// =====================
// Items Table Columns (legacy — kept for backwards compat)
// =====================

export function getItemsColumns(
  formatCurrency: (n: number) => string,
  onItemSelect: (index: number, selected: boolean) => void,
  onItemQtyChange: (index: number, qty: number) => void,
  onRefundAmountChange: (index: number, amount: number) => void,
): ColumnDef<ReturnableItem>[] {
  return [
    {
      id: "select",
      header: "",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.selected}
          onCheckedChange={(checked) =>
            onItemSelect(row.index, checked as boolean)
          }
          disabled={row.original.maxReturnableQty === 0}
        />
      ),
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {row.original.productName ||
              row.original.product?.name ||
              "Unknown"}
          </span>
          {row.original.variantName && (
            <span className="text-muted-foreground text-sm ml-1">
              ({row.original.variantName})
            </span>
          )}
          {row.original.conversionFactor &&
            row.original.conversionFactor > 1 && (
              <div className="text-xs text-muted-foreground">
                1 unit = {row.original.conversionFactor} pcs
              </div>
            )}
        </div>
      ),
    },
    {
      accessorKey: "receivedQuantity",
      header: "Received",
      cell: ({ row }) => row.original.receivedQuantity,
    },
    {
      accessorKey: "maxReturnableQty",
      header: "Returnable",
      cell: ({ row }) => (
        <span
          className={
            row.original.maxReturnableQty === 0 ? "text-muted-foreground" : ""
          }
        >
          {row.original.maxReturnableQty}
        </span>
      ),
    },
    {
      id: "returnQty",
      header: "Return Qty",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onItemQtyChange(row.index, row.original.returnQty - 1)
            }
            disabled={!row.original.selected || row.original.returnQty === 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <NumberField
            className="w-16 h-7 text-center"
            precision={0}
            value={row.original.returnQty}
            onChange={(v) => onItemQtyChange(row.index, v ?? 0)}
            disabled={row.original.maxReturnableQty === 0}
            min={0}
            max={row.original.maxReturnableQty}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onItemQtyChange(row.index, row.original.returnQty + 1)
            }
            disabled={row.original.returnQty >= row.original.maxReturnableQty}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price (MRP)",
      cell: ({ row }) => {
        const item = row.original;
        const displayPrice = item.costPrice || item.price;

        if (item.conversionFactor && item.conversionFactor > 1) {
          const pricePerPiece = displayPrice;
          const pricePerUnit = displayPrice * item.conversionFactor;
          return (
            <div className="text-right">
              <div className="font-medium">
                {formatCurrency(pricePerUnit)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(pricePerPiece)}/pc
              </div>
            </div>
          );
        }

        return (
          <div className="text-right">{formatCurrency(displayPrice)}</div>
        );
      },
    },
    {
      id: "refundAmount",
      header: "Refund Amount",
      cell: ({ row }) => {
        const item = row.original;
        const maxRefund = calculateMaxRefund(item.returnQty, item.refundUnitPrice);

        return (
          <div className="space-y-1">
            <NumberField
              className="w-28 h-7 text-right"
              precision={2}
              value={row.original.refundAmount}
              onChange={(v) => onRefundAmountChange(row.index, v ?? 0)}
              disabled={!row.original.selected}
              min={0}
              max={maxRefund}
            />
            {item.selected &&
              item.returnQty > 0 &&
              item.conversionFactor &&
              item.conversionFactor > 1 && (
                <div className="text-xs text-muted-foreground">
                  {item.returnQty} \u00d7 {item.conversionFactor} \u00d7{" "}
                  {formatCurrency(item.costPrice || item.price)}
                </div>
              )}
          </div>
        );
      },
    },
  ];
}
