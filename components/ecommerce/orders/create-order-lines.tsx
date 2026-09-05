"use client";
// coding-standard: maintained
import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { ProductSearch } from "@/components/sales/product-search";
import type { ExtractedProduct } from "@/components/sales/types";
import { formatCurrency } from "@/lib/currency";
import { useOrderableProducts } from "@/services/api";
import type {
  OrderQuote,
  OrderableProduct,
} from "@/services/api/modules/storefront-orders/api";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleTable } from "@/ui/components/simple-table";
import type { Line } from "./use-order-form";

/**
 * The product picker and line table on the create-order dialog.
 *
 * **Both halves show storefront prices, not POS prices.** The picker is fed from
 * `useOrderableProducts` — the storefront catalogue with any live campaign
 * applied — rather than the POS list the sell screen uses, and the Total column
 * shows the QUOTED line total rather than `price × quantity`. They have to agree,
 * because the merchant reads one off the dropdown and the other off the summary
 * before quoting a number in chat.
 */

/**
 * Map a picker row onto the shape `ProductSearch` renders.
 *
 * `costPrice` and `quantityAlert` are POS concepts with no storefront meaning; a
 * chat order never reads either, so they are zeroed rather than faked from a
 * catalogue that does not carry them.
 */
const toPickerItem = (row: OrderableProduct): ExtractedProduct =>
  ({
    value: `${row.productId}:${row.variantId ?? ""}`,
    label: row.label,
    price: row.price,
    compareAt: row.compareAt,
    costPrice: 0,
    availableQuantity: row.availableQuantity,
    // Same sentinel, same picker. The storefront's orderable-products list
    // carries `tracked` for exactly this reason.
    tracked: row.tracked,
    productId: row.productId,
    variantId: row.variantId ?? null,
    quantityAlert: 0,
  }) as ExtractedProduct;

export function CreateOrderLines({
  open,
  lines,
  onAdd,
  onQuantity,
  onRemove,
  quotedFor,
  rejectedFor,
  quoting,
  currency,
}: {
  /** Fetch the catalogue only while the dialog is open — it is a whole-store payload. */
  open: boolean;
  lines: Line[];
  onAdd: (product: ExtractedProduct) => void;
  onQuantity: (line: Line, quantity: number) => void;
  onRemove: (line: Line) => void;
  quotedFor: (line: Line) => OrderQuote["items"][number] | undefined;
  rejectedFor: (line: Line) => OrderQuote["rejected"][number] | undefined;
  quoting: boolean;
  currency?: string;
}) {
  const { data: orderable = [], isLoading } = useOrderableProducts(open);
  const pickerItems = useMemo(() => orderable.map(toPickerItem), [orderable]);

  return (
    <div className="space-y-2">
      <Label>Products</Label>
      <ProductSearch
        onSelect={onAdd}
        placeholder="Search products…"
        source={pickerItems}
        loading={isLoading}
      />
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
                    {/* The picker is storefront-priced now, so these agree in the
                        normal case and this stays hidden. It fires when the price
                        MOVED between picking and quoting — a campaign starting or
                        ending mid-session — which is worth saying out loud, since
                        the merchant may already have quoted the old number. */}
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
