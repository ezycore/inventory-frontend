// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { Activity, ArrowDownLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { formatDateTz } from './utils'
import { useMovementReasonLabel } from '@/hooks/use-movement-reason-label'

interface DetailActivityProps {
  movements: any[]
  /** Org IANA timezone — render movement timestamps in the user's day. */
  timezone?: string
  /** Link to the full, scoped movements page — shown only when more rows exist. */
  viewAllHref?: string
}

function locationName(m: any): string {
  return m.location?.name || m.locationId?.name || '—'
}

export function DetailActivity({ movements, timezone, viewAllHref }: DetailActivityProps) {
  const t = useTranslations('products.products.detail.activity')
  const reasonLabel = useMovementReasonLabel()
  const columns: SimpleColumn<any>[] = [
    {
      key: 'date',
      header: t('date'),
      cellClassName: 'text-muted-foreground',
      cell: (m) => formatDateTz(m.createdAt, timezone),
    },
    {
      key: 'type',
      header: t('type'),
      cell: (m) => (
        <Badge variant="secondary" className="font-medium">
          {reasonLabel(m.reason)}
        </Badge>
      ),
    },
    {
      key: 'location',
      header: t('location'),
      cell: (m) => locationName(m),
    },
    {
      key: 'change',
      header: t('change'),
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
      header: t('balance'),
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
            {t('title')}
          </CardTitle>
          {viewAllHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={viewAllHref}>
                {t('viewAll')}
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
            <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
