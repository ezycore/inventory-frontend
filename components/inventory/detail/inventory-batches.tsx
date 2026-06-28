// coding-standard: maintained
'use client'

import { differenceInCalendarDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/components/table'
import { CalendarClock } from 'lucide-react'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import { formatDate } from '@/components/products/detail/utils'

interface InventoryBatchesProps {
  batches: BatchRow[]
  formatCurrency: (n: number) => string
}

/** Expiry badge: expired / near (≤30d) / ok. */
function expiryBadge(expiryDate?: string | null) {
  if (!expiryDate) return <span className="text-muted-foreground">—</span>
  const days = differenceInCalendarDays(new Date(expiryDate), new Date())
  if (days < 0) return <Badge variant="destructive">Expired</Badge>
  if (days <= 30)
    return <Badge className="bg-amber-100 text-amber-700">{days}d left</Badge>
  return <Badge variant="secondary">{days}d left</Badge>
}

export function InventoryBatches({ batches, formatCurrency }: InventoryBatchesProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-amber-600" />
          Batches ({batches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => (
              <TableRow key={b._id}>
                <TableCell className="font-medium">{b.batchNumber || '—'}</TableCell>
                <TableCell className="text-right">{b.remainingQuantity.toLocaleString()}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {b.costPrice != null ? formatCurrency(b.costPrice) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(b.expiryDate ?? undefined)}</TableCell>
                <TableCell className="text-right">{expiryBadge(b.expiryDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
