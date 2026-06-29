// coding-standard: maintained
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { Activity, ArrowDownLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { StockMovementRow } from '@/services/api/modules/inventory/analytics.types'
import { formatDateTz, MOVEMENT_REASON_LABEL } from '@/components/products/detail/utils'

interface InventoryActivityProps {
  movements: StockMovementRow[]
  /** Org IANA timezone — render movement timestamps in the user's day. */
  timezone?: string
  /** Link to the full, scoped movements page — shown only when more rows exist. */
  viewAllHref?: string
}

export function InventoryActivity({ movements, timezone, viewAllHref }: InventoryActivityProps) {
  const columns: SimpleColumn<StockMovementRow>[] = [
    {
      key: 'date',
      header: 'Date',
      cellClassName: 'text-muted-foreground',
      cell: (m) => formatDateTz(m.createdAt, timezone),
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (m) => (
        <Badge variant="secondary" className="font-medium">
          {MOVEMENT_REASON_LABEL[m.reason] || m.reason}
        </Badge>
      ),
    },
    {
      key: 'by',
      header: 'By',
      cellClassName: 'text-muted-foreground',
      cell: (m) => m.createdBy?.email || '—',
    },
    {
      key: 'change',
      header: 'Change',
      align: 'right',
      cell: (m) => {
        const isIn = m.movementType === 'in'
        return (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              isIn ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isIn ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {isIn ? '+' : '−'}
            {m.quantity}
          </span>
        )
      },
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      cellClassName: 'font-medium',
      cell: (m) => m.newQuantity ?? '—',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-emerald-600" />
            Recent Movements
          </CardTitle>
          {viewAllHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={viewAllHref}>
                View all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {movements.length > 0 ? (
          <SimpleTable columns={columns} rows={movements} getRowKey={(m) => m._id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No movements recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
