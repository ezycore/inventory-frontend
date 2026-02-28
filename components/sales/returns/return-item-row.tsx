import { Plus, Minus } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Checkbox } from '@/ui/components/checkbox';
import type { ReturnableItem } from './types';

interface ReturnItemRowProps {
  item: ReturnableItem;
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
  onRefundChange,
}: ReturnItemRowProps) {
  const isDisabled = item.maxReturnableQty === 0;

  return (
    <div
      className={`flex items-center gap-4 p-4 border rounded-lg ${
        item.selected ? 'border-primary bg-primary/5' : 'border-border'
      } ${isDisabled ? 'opacity-50' : ''}`}
    >
      <Checkbox
        checked={item.selected}
        onCheckedChange={(checked) => onSelect(index, !!checked)}
        disabled={isDisabled}
      />

      <div className="flex-1">
        <div className="font-medium">{item.productName}</div>
        <div className="text-sm text-muted-foreground">
          Unit Price: {formatCurrency(item.price)} • Max Returnable:{' '}
          {item.maxReturnableQty}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onQtyChange(index, item.returnQty - 1)}
          disabled={item.returnQty <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          className="w-20 text-center"
          value={item.returnQty}
          onChange={(e) => onQtyChange(index, parseInt(e.target.value) || 0)}
          min={0}
          max={item.maxReturnableQty}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onQtyChange(index, item.returnQty + 1)}
          disabled={item.returnQty >= item.maxReturnableQty}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-32">
        <Label className="text-xs text-muted-foreground">Refund</Label>
        <Input
          type="number"
          value={item.refundAmount}
          onChange={(e) =>
            onRefundChange(index, parseFloat(e.target.value) || 0)
          }
          disabled={item.returnQty === 0}
        />
      </div>
    </div>
  );
}
