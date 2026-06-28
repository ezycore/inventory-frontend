// coding-standard: maintained
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/components/table'
import { MapPin, Package } from 'lucide-react'
import { getQuantityColor, type InventoryItem } from './utils'

interface DetailStockCardProps {
  inventoryItems: InventoryItem[]
}

export function DetailStockCard({ inventoryItems }: DetailStockCardProps) {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Shelf</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.location?.name || '—'}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {item.shelf || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={`${getQuantityColor(item.quantity)} border-0 font-semibold`}
                    >
                      {item.quantity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
