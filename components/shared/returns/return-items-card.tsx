import { Package } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
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

export function ReturnItemsCard({
  description = 'Choose which items to return and specify quantities',
  items,
  totalReturnQty,
  totalRefundAmount,
  formatCurrency,
  onSelect,
  onQtyChange,
  onRefundChange,
  getItemKey,
}: ReturnItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Select Items to Return
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const key = getItemKey
              ? getItemKey(item, index)
              : ((item as { inventoryId?: string }).inventoryId ??
                (item as { productId?: string }).productId ??
                index);

            return (
              <ReturnItemRow
                key={key}
                item={item}
                index={index}
                formatCurrency={formatCurrency}
                onSelect={onSelect}
                onQtyChange={onQtyChange}
                onRefundChange={onRefundChange}
              />
            );
          })}
        </div>

        {totalReturnQty > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-lg font-medium">
              <span>Total Return:</span>
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
