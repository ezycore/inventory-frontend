// coding-standard: maintained
import { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, Package, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/ui/components/badge'
import { Button } from '@/ui/components/button'
import type { AdjustmentItem } from '@/services/stores/stock-adjustment-store'
import type { Translator } from '@/i18n/config'
import { formatCurrency } from '@/lib/currency'
import { fromBaseUnit, formatQuantity } from '@/utils/uom-conversion'
import { itemValueDelta } from '@/components/inventory/adjust/adjustment-value'

// Compute quantity change for display
const getQuantityChange = (current: number, newQty: number, noChangeLabel: string) => {
  const diff = newQty - current
  if (diff === 0) return { text: noChangeLabel, className: 'text-muted-foreground' }
  if (diff > 0) return { text: `+${diff}`, className: 'text-green-600' }
  return { text: `${diff}`, className: 'text-red-500' }
}

interface AdjustmentColumnOptions {
  editingId: string | null
  onEdit: (item: AdjustmentItem) => void
  onRemove: (id: string) => void
  /** Bound to the `inventory` namespace. */
  t: Translator
}

export function getAdjustmentColumns({
  editingId,
  onEdit,
  onRemove,
  t,
}: AdjustmentColumnOptions): ColumnDef<AdjustmentItem>[] {
  return [
    {
      accessorKey: 'product_name',
      header: t('shared.product'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.product_name}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(row.original.price)}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'currentQuantity',
      header: t('adjust.colCurrent'),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <span className="text-muted-foreground tabular-nums">
              {item.currentQuantity}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </span>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground">
                ≈{formatQuantity(fromBaseUnit(item.currentQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'arrow',
      header: '',
      cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    },
    {
      accessorKey: 'newQuantity',
      header: t('adjust.colNewQty'),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <span className="font-semibold tabular-nums">
              {item.newQuantity}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </span>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground">
                ≈{formatQuantity(fromBaseUnit(item.newQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'change',
      header: t('adjust.colChange'),
      cell: ({ row }) => {
        const item = row.original
        const change = getQuantityChange(item.currentQuantity, item.newQuantity, t('adjust.noChange'))
        return (
          <div>
            <Badge variant="outline" className={change.className}>
              {change.text}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </Badge>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.newQuantity - item.currentQuantity > 0 ? '+' : ''}
                {formatQuantity(fromBaseUnit(item.newQuantity - item.currentQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'value',
      header: t('adjust.colValue'),
      cell: ({ row }) => {
        const value = itemValueDelta(row.original)
        if (value === 0) {
          return <span className="text-muted-foreground tabular-nums">—</span>
        }
        return (
          <span className={`font-medium tabular-nums ${value > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {value > 0 ? '+' : '-'}{formatCurrency(Math.abs(value))}
          </span>
        )
      },
    },
    {
      accessorKey: 'notes',
      header: t('shared.notes'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {row.original.notes || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(row.original)}
            disabled={editingId === row.original.id}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]
}
