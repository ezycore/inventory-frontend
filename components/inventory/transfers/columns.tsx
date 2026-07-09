// coding-standard: maintained
import { ColumnDef } from '@tanstack/react-table'
import { Package, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/ui/components/button'
import type { TransferItem } from '@/services/stores/stock-transfer-store'
import { formatCurrency } from '@/lib/currency'
import { fromBaseUnit, formatQuantity } from '@/utils/uom-conversion'

interface TransferColumnOptions {
  editingId: string | null
  onEdit: (item: TransferItem) => void
  onRemove: (id: string) => void
}

export function getTransferColumns({
  editingId,
  onEdit,
  onRemove,
}: TransferColumnOptions): ColumnDef<TransferItem>[] {
  return [
    {
      accessorKey: 'product_name',
      header: 'Product',
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
      header: 'Available',
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
      accessorKey: 'transferQuantity',
      header: 'Transfer Qty',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <span className="font-semibold tabular-nums">
              {item.transferQuantity}{item.baseUnitName ? ` ${item.baseUnitName}` : ''}
            </span>
            {item.enableUOMConversion && item.conversionFactor && (
              <div className="text-xs text-muted-foreground">
                ≈{formatQuantity(fromBaseUnit(item.transferQuantity, item.conversionFactor))} {item.purchaseUnitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
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
