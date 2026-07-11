import { useTranslations } from 'next-intl';
import { Minus, Package, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Checkbox } from '@/ui/components/checkbox';
import { NumberField } from '@/ui/components/number-field';
import { ReturnItemRow } from './return-item-row';
import type { ReturnableItemDisplay } from './return-item-row';

export interface ReturnItemsCardProps {
  /** Override the default description text */
  description?: string;
  items: ReturnableItemDisplay[];
  totalReturnQty: number;
  totalRefundAmount: number;
  formatCurrency: (n: number) => string;
  onSelect: (index: number, selected: boolean) => void;
  onQtyChange: (index: number, qty: number) => void;
  onRefundChange: (index: number, amount: number) => void;
  /** Custom key resolver — defaults to inventoryId ?? productId ?? index */
  getItemKey?: (
    item: ReturnableItemDisplay,
    index: number,
  ) => string | number;
}

/** An item paired with its original index (callbacks are index-based). */
interface IndexedItem {
  item: ReturnableItemDisplay;
  index: number;
}

/** A display group: a combo (component rows + header) or a single standalone line. */
interface ReturnGroup {
  comboLineId?: string;
  comboName?: string;
  entries: IndexedItem[];
}

/** Group rows by comboLineId (combo lines only), preserving original indices + order. */
function groupReturnRows(items: ReturnableItemDisplay[]): ReturnGroup[] {
  const groups: ReturnGroup[] = [];
  const byCombo = new Map<string, ReturnGroup>();
  items.forEach((item, index) => {
    if (item.comboLineId) {
      let group = byCombo.get(item.comboLineId);
      if (!group) {
        group = { comboLineId: item.comboLineId, comboName: item.comboName, entries: [] };
        byCombo.set(item.comboLineId, group);
        groups.push(group);
      }
      group.entries.push({ item, index });
    } else {
      groups.push({ entries: [{ item, index }] });
    }
  });
  return groups;
}

/**
 * Combo header: returns whole combo units. Setting k fans out to each component
 * row as `qtyPer × k` via the index-based `onQtyChange`. Component rows below
 * remain individually editable for partial adjustments.
 */
function ComboReturnHeader({
  group,
  formatCurrency,
  onQtyChange,
  onSelect,
}: {
  group: ReturnGroup;
  formatCurrency: (n: number) => string;
  onQtyChange: (index: number, qty: number) => void;
  onSelect: (index: number, selected: boolean) => void;
}) {
  const qtyPer = (e: IndexedItem) => e.item.comboUnitQuantity || 1;
  const maxCombos = Math.min(
    ...group.entries.map((e) => Math.floor(e.item.maxReturnableQty / qtyPer(e))),
  );
  // Whole combos currently selected across the group (min keeps it consistent).
  const currentCombos = Math.min(
    ...group.entries.map((e) => Math.floor(e.item.returnQty / qtyPer(e))),
  );
  const refundTotal = group.entries.reduce((sum, e) => sum + e.item.refundAmount, 0);
  const anySelected = group.entries.some((e) => e.item.selected);
  const disabled = maxCombos <= 0;

  const setCombos = (k: number) => {
    const units = Math.max(0, Math.min(k, maxCombos));
    group.entries.forEach((e) => onQtyChange(e.index, qtyPer(e) * units));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={anySelected}
          disabled={disabled}
          onCheckedChange={(checked) => {
            if (checked) setCombos(maxCombos);
            else group.entries.forEach((e) => onSelect(e.index, false));
          }}
        />
        <Package className="h-4 w-4 text-orange-600" />
        <span className="font-medium">{group.comboName ?? 'Combo'}</span>
        <Badge className="bg-orange-100 text-orange-700">Combo</Badge>
        <span className="text-xs text-muted-foreground">Max {maxCombos} combo(s)</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Return</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCombos(currentCombos - 1)}
            disabled={currentCombos <= 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <NumberField
            className="h-8 w-14 text-center text-sm"
            value={currentCombos}
            onChange={(v) => setCombos(v ?? 0)}
            precision={0}
            min={0}
            max={maxCombos}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCombos(currentCombos + 1)}
            disabled={currentCombos >= maxCombos}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground ml-1">combo(s)</span>
        </div>
        {refundTotal > 0 && (
          <span className="text-sm font-medium">{formatCurrency(refundTotal)}</span>
        )}
      </div>
    </div>
  );
}

export function ReturnItemsCard({
  description,
  items,
  totalReturnQty,
  totalRefundAmount,
  formatCurrency,
  onSelect,
  onQtyChange,
  onRefundChange,
  getItemKey,
}: ReturnItemsCardProps) {
  const t = useTranslations('common.returns');
  const resolvedDescription = description ?? t('itemsDefaultDescription');
  const groups = groupReturnRows(items);

  const rowKey = (entry: IndexedItem) =>
    getItemKey
      ? getItemKey(entry.item, entry.index)
      : ((entry.item as { inventoryId?: string }).inventoryId ??
        (entry.item as { productId?: string }).productId ??
        entry.index);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Select Items to Return
        </CardTitle>
        <CardDescription>{resolvedDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups.map((group, gi) =>
            group.comboLineId ? (
              // Combo: whole-combo header + nested, individually-editable component rows.
              <div key={`combo-${group.comboLineId}`} className="space-y-2 rounded-lg border border-orange-100 p-2">
                <ComboReturnHeader
                  group={group}
                  formatCurrency={formatCurrency}
                  onQtyChange={onQtyChange}
                  onSelect={onSelect}
                />
                <div className="space-y-3 pl-2">
                  {group.entries.map((entry) => (
                    <ReturnItemRow
                      key={rowKey(entry)}
                      item={entry.item}
                      index={entry.index}
                      formatCurrency={formatCurrency}
                      onSelect={onSelect}
                      onQtyChange={onQtyChange}
                      onRefundChange={onRefundChange}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <ReturnItemRow
                key={rowKey(group.entries[0]) || `row-${gi}`}
                item={group.entries[0].item}
                index={group.entries[0].index}
                formatCurrency={formatCurrency}
                onSelect={onSelect}
                onQtyChange={onQtyChange}
                onRefundChange={onRefundChange}
              />
            ),
          )}
        </div>

        {totalReturnQty > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-lg font-medium">
              <span>{t('totalReturn')}</span>
              <span>
                {totalReturnQty} items &bull;{' '}
                {formatCurrency(totalRefundAmount)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
