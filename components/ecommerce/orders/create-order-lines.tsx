"use client";
// coding-standard: maintained
import { Trash2 } from "lucide-react";
import { ProductSearch } from "@/components/sales/product-search";
import type { ExtractedProduct } from "@/components/sales/types";
import { formatCurrency } from "@/lib/currency";
import type { OrderQuote } from "@/services/api/modules/storefront-orders/api";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleTable } from "@/ui/components/simple-table";
import type { Line } from "./use-create-order-form";

/**
 * The product picker and line table on the create-order dialog.
 *
 * **The Total column shows the QUOTED line total, never `price × quantity`.** The
 * picker is the POS catalogue, so its price is `product.price`; the order charges
 * `storefront.onlinePrice ?? price` repriced by any live campaign. Where the two
 * differ the row says so, because the merchant just read the other number off the
 * search result and is about to quote it to a buyer.
 */
export function CreateOrderLines({
  lines,
  onAdd,
  onQuantity,
  onRemove,
  quotedFor,
  rejectedFor,
  quoting,
  currency,
}: {
  lines: Line[];
  onAdd: (product: ExtractedProduct) => void;
  onQuantity: (line: Line, quantity: number) => void;
  onRemove: (line: Line) => void;
  quotedFor: (line: Line) => OrderQuote["items"][number] | undefined;
  rejectedFor: (line: Line) => OrderQuote["rejected"][number] | undefined;
  quoting: boolean;
  currency?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>Products</Label>
      <ProductSearch onSelect={onAdd} placeholder="Search products…" />
      {lines.length > 0 ? (
        <SimpleTable
          columns={[
            { key: "item", header: "Item", cell: (l: Line) => l.label },
            {
              key: "qty",
              header: "Qty",
              align: "right",
              cell: (l: Line) => (
                <NumberField
                  value={l.quantity}
                  precision={0}
                  min={1}
                  max={l.availableQuantity}
                  onChange={(v) => onQuantity(l, v ?? 1)}
                  className="w-20"
                />
              ),
            },
            {
              key: "total",
              header: "Total",
              align: "right",
              cell: (l: Line) => {
                const bad = rejectedFor(l);
                if (bad) {
                  return (
                    <span className="text-xs text-destructive">{bad.message}</span>
                  );
                }
                const quoted = quotedFor(l);
                if (!quoted) {
                  return (
                    <span className="text-muted-foreground">
                      {quoting ? "…" : "—"}
                    </span>
                  );
                }
                return (
                  <span>
                    {formatCurrency(quoted.subtotal, currency)}
                    {/* Surfaced only when it differs from the POS price the
                        merchant just saw in the picker — otherwise it is noise
                        on every row. */}
                    {quoted.price !== l.price ? (
                      <span className="block text-xs text-muted-foreground">
                        online {formatCurrency(quoted.price, currency)} ea
                      </span>
                    ) : null}
                  </span>
                );
              },
            },
            {
              key: "remove",
              header: "",
              align: "right",
              cell: (l: Line) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(l)}
                  aria-label={`Remove ${l.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ),
            },
          ]}
          rows={lines}
          getRowKey={(l: Line) => `${l.productId}:${l.variantId ?? ""}`}
        />
      ) : null}
    </div>
  );
}
