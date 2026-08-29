import { useTranslations } from 'next-intl';
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
  /**
   * The tax-inclusive per-unit amount THIS return is actually priced at —
   * sale price on a sales return, cost on a purchase return. Both builders
   * (use-returnable-items.ts, purchases/returns/helpers.ts) already compute
   * this, and it's what refundAmount is derived from, so it's the only field
   * that reconciles Price × Qty against Refund on both sides. Takes
   * precedence over price/costPrice below, which can't tell the two
   * contexts apart on their own — a SaleItem also carries a costPrice.
   */
  refundUnitPrice?: number;
  /** Per-item discount amount */
  discount?: number;
  /** UOM conversion info (purchase returns) */
  conversionFactor?: number;
  /** Combo provenance (sales returns) — used to group component lines under a combo. */
  comboLineId?: string;
  comboName?: string;
  /** qtyPer (base units per 1 combo) — lets the combo header return whole combo units. */
  comboUnitQuantity?: number;
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
  const t = useTranslations('common.returns');
  const isDisabled = item.maxReturnableQty === 0;
  // refundUnitPrice takes precedence, matching the field doc above: it's the
  // per-unit amount this return is priced at, computed by whichever builder
  // built the item, so it's unambiguous per context. costPrice ?? price
  // alone can't disambiguate — a SaleItem carries a costPrice too, so on a
  // sales return that fallback showed cost instead of sale price whenever
  // one happened to be present.
  const displayPrice = item.refundUnitPrice ?? item.costPrice ?? item.price ?? 0;
  const displayName = item.productName ?? item.product?.name ?? t('product');

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
        {/* min-w-0: without it this flex item is floored at the fields grid's
            min-content width, so the row cannot narrow on small screens. */}
        <div className="min-w-0 flex-1 space-y-3">
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

          {/* Fields grid: Unit Refund | Discount | Qty | Refund */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Unit Refund (read-only). Labeled "Unit Refund", not "Price": the
                cell holds displayPrice (== refundUnitPrice when set), which is
                already net of discount — a raw "Price" label made the row look
                inconsistent on a discounted line (Price × Qty appeared not to
                match Refund once Discount was subtracted a second time, when
                it was never subtracted from Refund in the first place). */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Unit Refund</Label>
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

            {/* Return Qty (editable). Full row on mobile: the stepper needs
                ~146px and a half-width column gives ~130px, which shrank the
                input until the digit itself was clipped. */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
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
                  className="h-9 min-w-0 flex-1 text-center text-sm sm:w-16 sm:flex-none"
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
            <div className="space-y-1 col-span-2 sm:col-span-1">
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
