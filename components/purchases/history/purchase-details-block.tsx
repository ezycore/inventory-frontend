"use client";

import { format } from "date-fns";
import { Boxes, ClipboardList } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { InfoField } from "@/components/shared/info-field";
import type { PurchaseOrder, PurchaseReturn } from "@/types";
import { CopyField } from "@/ui/components/copy";

function getCreatedByName(order: PurchaseOrder): string {
  const cb = order.createdBy;
  if (cb && typeof cb === "object") {
    const name = [cb.firstName, cb.lastName].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (cb.email) return cb.email;
  }
  return "-";
}

export function PurchaseDetailsBlock({ order, purchaseReturns }: { order: PurchaseOrder; purchaseReturns: PurchaseReturn[] }) {
  const supplierName = order.supplierId?.name ?? order.supplier?.name ?? "Unknown Supplier";
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoField label="Invoice #" value={<CopyField value={order.orderNumber} />} />
        <InfoField
          label="Status"
          value={
            <Badge variant="outline" className="capitalize">
              {order.status}
            </Badge>
          }
        />
        <InfoField label="Supplier" value={supplierName} />
        <InfoField label="Created By" value={getCreatedByName(order)} />
        <InfoField
          label="Created At"
          value={format(new Date(order.createdAt), "dd MMM yyyy hh:mm aa")}
        />
        <InfoField
          label="Updated At"
          value={format(new Date(order.updatedAt), "dd MMM yyyy hh:mm aa")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoField label="Total" value={order.subtotal} showCurrency />
        <InfoField
          label="Additional Discount"
          value={order.additionalDiscount ?? 0}
          showCurrency
        />
        {(order.taxTotal ?? 0) > 0 ? (
          <InfoField label="Tax" value={order.taxTotal} showCurrency />
        ) : null}
        <InfoField
          label="Invoice Amount"
          value={order.invoiceAmount ?? 0}
          showCurrency
        />
        <InfoField
          label="Paid Amount"
          value={order.paidAmount ?? 0}
          showCurrency
          valueClassName="text-green-600"
        />
        {/* {
          order.refundCreditApplied ? (
            <InfoField
              label="Refund Credits Applied"
              value={order.refundCreditApplied}
              showCurrency
              valueClassName="text-emerald-600"
            />
          ) : ""
        } */}
        {
          purchaseReturns.length > 0 && <InfoField
            label="Refund Amount"
            value={purchaseReturns.reduce((sum, ret) => sum + (ret.totalRefundAmount), 0)}
            showCurrency
            valueClassName="text-red-600"
          />
        }
        {
          order.dueAmount > 0 && <InfoField
            label="Due Amount"
            value={order.dueAmount ?? 0}
            showCurrency
            valueClassName={(order.dueAmount ?? 0) > 0 ? "text-red-600" : "text-green-600"}
          />
        }
      </div>

      {order.notes && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <ClipboardList className="h-4 w-4" />
            Notes
          </div>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}
    </>
  );
}

export function PurchaseItemsList({ order }: { order: PurchaseOrder }) {
  console.log("Rendering PurchaseItemsList with items:", order.items);
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2 font-medium">
        <Boxes className="h-4 w-4" />
        Items ({order.items.length})
      </div>

      <div className="space-y-3">
        {order.items.map((item, index) => {
          const unitSuffix = item.purchaseUnitName ? ` / ${item.purchaseUnitName}` : "";
          return (
            <div
              key={`${item.productId}-${index}`}
              className="space-y-3 rounded-lg bg-muted/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {item.productName || item.product?.name || "Product"}
                  </div>
                  {item.variantName && (
                    <div className="text-xs text-muted-foreground">{item.variantName}</div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">
                    Qty {item.quantity}
                    {unitSuffix}
                  </Badge>
                  <Badge variant="secondary">
                    Received {item.receivedQuantity ?? 0}/{item.quantity}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField
                  label="Price"
                  value={item.price}
                  showCurrency
                  quantity={item.quantity}
                />
                <InfoField
                  label="Discount"
                  value={item.price - (item.costPrice ?? 0)}
                  showCurrency
                  quantity={item.quantity}
                />
                <InfoField label="Cost Price" value={item.costPrice} showCurrency quantity={item.quantity} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
