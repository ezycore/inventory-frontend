"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Clock,
  Minus,
  Plus,
  XCircle,
} from "lucide-react";

import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import type { PurchaseReturn } from "@/types";
import type { ReturnableItem } from "./types";
import { calculateMaxRefund } from "./helpers";

// =====================
// Status Badge
// =====================

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// =====================
// Returns Table Columns
// =====================

export function getReturnsColumns(
  isAccountsEnabled: boolean,
  formatCurrency: (n: number) => string,
): ColumnDef<PurchaseReturn>[] {
  return [
    {
      accessorKey: "returnNumber",
      header: "Return #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.returnNumber}</span>
      ),
    },
    {
      accessorKey: "purchaseOrderId",
      header: "Original Order",
      cell: ({ row }) => {
        const purchaseOrderId = row.original.purchaseOrderId;
        let orderNumber: string;
        if (
          typeof purchaseOrderId === "object" &&
          purchaseOrderId?.orderNumber
        ) {
          orderNumber = purchaseOrderId.orderNumber;
        } else if (row.original.orderNumber) {
          orderNumber = row.original.orderNumber;
        } else {
          orderNumber = String(purchaseOrderId);
        }
        return <span className="font-mono text-sm">{orderNumber}</span>;
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.items?.length || 0} item(s)
        </span>
      ),
    },
    {
      accessorKey: "totalRefundAmount",
      header: "Refund Amount",
      cell: ({ row }) => (
        <span className="font-medium text-orange-600">
          {formatCurrency(row.original.totalRefundAmount || 0)}
        </span>
      ),
    },
    ...(isAccountsEnabled
      ? [
          {
            accessorKey: "refundAllocation" as const,
            header: "Allocation",
            cell: ({ row }: { row: { original: PurchaseReturn } }) => {
              const ret = row.original;
              const cashRefund = ret.refundedAmount || 0;
              const dueAdjusted = (ret.totalRefundAmount || 0) - cashRefund;

              if (cashRefund > 0 && dueAdjusted > 0) {
                return (
                  <div className="text-xs space-y-0.5">
                    <div className="text-red-600">
                      Cash: {formatCurrency(cashRefund)}
                    </div>
                    <div className="text-blue-600">
                      Due Adj: {formatCurrency(dueAdjusted)}
                    </div>
                  </div>
                );
              } else if (cashRefund > 0) {
                return (
                  <span className="text-xs text-red-600">Cash Refund</span>
                );
              } else if (dueAdjusted > 0) {
                return (
                  <span className="text-xs text-blue-600">Due Adjusted</span>
                );
              }
              return <span className="text-xs text-muted-foreground">-</span>;
            },
          },
        ]
      : []),
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.original.reason?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];
}

// =====================
// Items Table Columns
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
          <Input
            type="number"
            className="w-16 h-7 text-center"
            value={row.original.returnQty}
            onChange={(e) =>
              onItemQtyChange(row.index, parseInt(e.target.value) || 0)
            }
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
        const maxRefund = calculateMaxRefund(
          item.returnQty,
          item.conversionFactor,
          item.costPrice,
          item.price,
        );

        return (
          <div className="space-y-1">
            <Input
              type="number"
              className="w-28 h-7 text-right"
              value={row.original.refundAmount}
              onChange={(e) =>
                onRefundAmountChange(
                  row.index,
                  parseFloat(e.target.value) || 0,
                )
              }
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
