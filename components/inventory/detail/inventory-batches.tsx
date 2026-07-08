// coding-standard: maintained
'use client'

import { useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { CalendarClock, ChevronDown, ChevronUp } from 'lucide-react'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'
import { formatDate } from '@/components/products/detail/utils'

interface InventoryBatchesProps {
  batches: BatchRow[]
  formatCurrency: (n: number) => string
}

// Batches are FEFO-ordered (soonest expiry first); show the most urgent few and
// let the user expand the rest in place — the full set is already loaded.
const BATCH_PREVIEW_COUNT = 5

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
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const [expanded, setExpanded] = useState(false)
  const hasMore = batches.length > BATCH_PREVIEW_COUNT
  const shown = expanded ? batches : batches.slice(0, BATCH_PREVIEW_COUNT)

  const columns: SimpleColumn<BatchRow>[] = [
    {
      key: 'batch',
      header: 'Batch',
      cellClassName: 'font-medium',
      cell: (b) => b.batchNumber || '—',
    },
    {
      key: 'onHand',
      header: 'On hand',
      align: 'right',
      cell: (b) => b.remainingQuantity.toLocaleString(),
    },
    ...(canViewCosts
      ? [
          {
            key: 'cost',
            header: 'Cost',
            align: 'right',
            cellClassName: 'text-muted-foreground',
            cell: (b) => (b.costPrice != null ? formatCurrency(b.costPrice) : '—'),
          } satisfies SimpleColumn<BatchRow>,
        ]
      : []),
    {
      key: 'expiry',
      header: 'Expiry',
      cellClassName: 'text-muted-foreground',
      cell: (b) => formatDate(b.expiryDate ?? undefined),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      cell: (b) => expiryBadge(b.expiryDate),
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-amber-600" />
          Batches ({batches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable columns={columns} rows={shown} getRowKey={(b) => b._id} />

        {hasMore && (
          <div className="mt-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? (
                <>
                  Show less
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Show all {batches.length}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
