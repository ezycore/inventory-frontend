"use client";
// coding-standard: maintained
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import { ProductThumb } from "@/components/sales/product-thumb";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { CartLineSerials } from "@/components/sales/serials/cart-line-serials";
import { BatchSelect } from "@/components/shared/batch-select";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";

/**
 * The cart on a phone: one card per line instead of New Sale's eight-column
 * table, with the same edits — price, quantity, per-unit discount, batch, remove —
 * through the same store actions the table's cells call.
 */
export function PosCartCards({
  ctx,
  thumbnails,
}: {
  ctx: SellPageContext;
  thumbnails: Map<string, string>;
}) {
  const t = useTranslations("sales.sell.cart");
  const tPos = useTranslations("sales.pos");
  const { items, updateItem, removeItem, handleUpdateDiscount, handleUpdatePrice, isExpiryEnabled, serialsEnabled, symbol } = ctx;

  return (
    <ul className="divide-y">
      {items.map((item) => {
        const maxQty = item.availableQuantity ?? Number.MAX_SAFE_INTEGER;
        return (
          <li key={item.id} className="space-y-2.5 p-3">
            <div className="flex items-start gap-3">
              <ProductThumb src={thumbnails.get(item.productId)} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-snug">{item.productName}</div>
                {item.tracked !== false && item.availableQuantity !== null && (
                  <div className="text-xs text-muted-foreground">
                    {tPos("available", {
                      count: item.availableQuantity,
                      unit: item.unitName || "",
                    })}
                  </div>
                )}
                {item.tracked !== false && (item.heldQuantity ?? 0) > 0 && (
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    {t("heldForOnline", { count: item.heldQuantity as number })}
                  </div>
                )}
                {serialsEnabled && (
                  <CartLineSerials item={item} onChange={(serials) => updateItem(item.id, { serials })} />
                )}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                  {/* This sale's price only; combo lines are priced by the server. */}
                  {item.isCombo ? (
                    formatCurrency(item.price)
                  ) : (
                    <NumberField
                      aria-label={t("priceMrp")}
                      precision={2}
                      min={0}
                      value={item.price}
                      onChange={(v) => handleUpdatePrice(item.id, v ?? item.price)}
                      className="h-8 w-20 px-1 text-right text-sm tabular-nums"
                    />
                  )}
                  <span>× {item.quantity}</span>
                </div>
              </div>
              <div className="text-right text-sm font-semibold tabular-nums">
                {formatCurrency(item.total)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10"
                  aria-label={tPos("lessQty")}
                  onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="size-4" />
                </Button>
                <NumberField
                  aria-label={t("quantity")}
                  precision={0}
                  min={1}
                  max={maxQty}
                  value={item.quantity}
                  onChange={(v) => updateItem(item.id, { quantity: v ?? 1 })}
                  className="h-10 w-14 px-1 text-center text-base tabular-nums"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10"
                  aria-label={tPos("moreQty")}
                  onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                  disabled={item.quantity >= maxQty}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                {t("discount", { symbol: symbol || "" })}
                <NumberField
                  precision={2}
                  min={0}
                  max={item.price}
                  value={item.discount || 0}
                  onChange={(v) => handleUpdateDiscount(item.id, v ?? 0, item.price)}
                  className="h-10 w-20 text-right text-sm tabular-nums"
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={tPos("removeItem")}
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {isExpiryEnabled && item.hasExpiry && (
              <BatchSelect
                productId={item.productId}
                variantId={item.variantId}
                value={item.batchId ?? null}
                onChange={(batchId) => updateItem(item.id, { batchId })}
                emptyLabel={t("autoFefo")}
                hideExpired
                title={t("fefoTooltip")}
                className="h-10 w-full text-sm"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
