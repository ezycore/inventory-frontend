import { Plus, Minus } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Checkbox } from '@/ui/components/checkbox';
import { NumberField } from '@/ui/components/number-field';

/** Minimal shape required by ReturnItemRow — both SaleItem and PurchaseOrderItem satisfy this. */
export interface ReturnableItemDisplay {
  selected: boolean;
  maxReturnableQty: number;
  returnQty: number;
  refundAmount: number;
  /** Primary display name */
  productName?: string;
  /** Fallback when productName is absent */
  product?: { name?: string };
  /** Variant label (optional) */
  variantName?: string;
  /** Sale price (used in sales returns) */
  price?: number;
  /** Cost price (used in purchase returns; takes precedence for display) */
  costPrice?: number;
  /** Per-item discount amount */
  discount?: number;
  /** UOM conversion info (purchase returns) */
  conversionFactor?: number;
}

interface ReturnItemRowProps {
  item: ReturnableItemDisplay;
  index: number;
  formatCurrency: (n: number) => string;
  onSelect: (index: number, selected: boolean) => void;
  onQtyChange: (index: number, qty: number) => void;
  onRefundChange: (index: number, amount: number) => void;
}

export function ReturnItemRow({
  item,
  index,
  formatCurrency,
  onSelect,
  onQtyChange,
  onRefundChange: _onRefundChange,
}: ReturnItemRowProps) {
  const isDisabled = item.maxReturnableQty === 0;
  const displayPrice = item.price ?? 0;
  const displayName = item.productName ?? item.product?.name ?? 'Product';

  return (
    <div
      className={`p-4 border rounded-lg ${
        item.selected ? 'border-primary bg-primary/5' : 'border-border'
      } ${isDisabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={item.selected}
          onCheckedChange={(checked) => onSelect(index, !!checked)}
          disabled={isDisabled}
        />
        <div className="flex-1 space-y-3">
          {/* Product name + max qty hint */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-medium">{displayName}</span>
              {item.variantName && (
                <span className="text-muted-foreground text-sm ml-1">
                  ({item.variantName})
                </span>
              )}
              {item.conversionFactor && item.conversionFactor > 1 && (
                <span className="text-xs text-muted-foreground ml-2">
                  · 1 unit = {item.conversionFactor} pcs
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Max returnable: {item.maxReturnableQty}
            </span>
          </div>

          {/* Fields grid: Price | Discount | Qty | Refund */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Price (read-only) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Price</Label>
              <Input
                value={formatCurrency(displayPrice)}
                readOnly
                disabled
                className="h-9 text-sm"
              />
            </div>

            {/* Discount (read-only) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Discount</Label>
              <Input
                value={
                  item.discount != null && item.discount > 0
                    ? formatCurrency(item.discount)
                    : '—'
                }
                readOnly
                disabled
                className="h-9 text-sm"
              />
            </div>

            {/* Return Qty (editable) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Return Qty</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => onQtyChange(index, item.returnQty - 1)}
                  disabled={item.returnQty <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <NumberField
                  className="h-9 w-16 text-center text-sm"
                  value={item.returnQty}
                  onChange={(v) => onQtyChange(index, v ?? 0)}
                  precision={0}
                  min={0}
                  max={item.maxReturnableQty}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => onQtyChange(index, item.returnQty + 1)}
                  disabled={item.returnQty >= item.maxReturnableQty}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Refund Amount (read-only, auto-calculated) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Refund Amount</Label>
              <Input
                value={formatCurrency(item.refundAmount)}
                readOnly
                disabled
                className="h-9 text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
