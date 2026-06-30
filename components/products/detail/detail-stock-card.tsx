// coding-standard: maintained
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { MapPin, Package } from 'lucide-react'
import { getQuantityColor, type InventoryItem } from './utils'

interface DetailStockCardProps {
  inventoryItems: InventoryItem[]
}

export function DetailStockCard({ inventoryItems }: DetailStockCardProps) {
  const columns: SimpleColumn<InventoryItem>[] = [
    {
      key: 'location',
      header: 'Location',
      cellClassName: 'font-medium',
      cell: (item) => item.location?.name || '—',
    },
    {
      key: 'shelf',
      header: 'Shelf',
      cellClassName: 'font-mono text-sm text-muted-foreground',
      cell: (item) => item.shelf || '—',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      cell: (item) => (
        <Badge
          variant="secondary"
          className={`${getQuantityColor(item.quantity)} border-0 font-semibold`}
        >
          {item.quantity}
        </Badge>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-emerald-600" />
          Stock by Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inventoryItems.length > 0 ? (
          <SimpleTable columns={columns} rows={inventoryItems} getRowKey={(item) => item._id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No stock data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
