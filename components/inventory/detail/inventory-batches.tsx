// coding-standard: maintained
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { CalendarClock, ChevronDown, ChevronUp } from 'lucide-react'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import {
  batchNumberLabel,
  expiryLabel,
  isUnknownExpiry,
} from '@/components/shared/batch-select'
import { ExpiryBadge } from '@/components/shared/expiry/expiry-badge'
import { AssignExpiryDialog } from './assign-expiry-dialog'
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission'
import { formatDate } from '@/components/products/detail/utils'

interface InventoryBatchesProps {
  batches: BatchRow[]
  formatCurrency: (n: number) => string
}

// Batches are FEFO-ordered (soonest expiry first); show the most urgent few and
// let the user expand the rest in place — the full set is already loaded.
const BATCH_PREVIEW_COUNT = 5

export function InventoryBatches({ batches, formatCurrency }: InventoryBatchesProps) {
  const t = useTranslations('inventory.detail')
  const tBatch = useTranslations('inventory.batch')
  const tStatus = useTranslations('common.status')
  const canViewCosts = useHasPermission(PERMISSIONS.costsView)
  const canManageStock = useHasPermission(PERMISSIONS.stockManage)
  const [expanded, setExpanded] = useState(false)
  const [assigning, setAssigning] = useState<BatchRow | null>(null)
  const hasMore = batches.length > BATCH_PREVIEW_COUNT
  const shown = expanded ? batches : batches.slice(0, BATCH_PREVIEW_COUNT)

  const columns: SimpleColumn<BatchRow>[] = [
    {
      key: 'batch',
      header: t('colBatch'),
      cellClassName: 'font-medium',
      cell: (b) => (
        <span className={isUnknownExpiry(b) ? 'text-muted-foreground italic' : ''}>
          {batchNumberLabel(b, tBatch)}
        </span>
      ),
    },
    {
      key: 'onHand',
      header: t('colOnHand'),
      align: 'right',
      cell: (b) => b.remainingQuantity.toLocaleString(),
    },
    ...(canViewCosts
      ? [
          {
            key: 'cost',
            header: t('colCost'),
            align: 'right',
            cellClassName: 'text-muted-foreground',
            cell: (b) => (b.costPrice != null ? formatCurrency(b.costPrice) : '—'),
          } satisfies SimpleColumn<BatchRow>,
        ]
      : []),
    {
      key: 'expiry',
      header: t('colExpiry'),
      cellClassName: 'text-muted-foreground',
      cell: (b) => expiryLabel(b, tBatch, (d) => formatDate(d) || d),
    },
    {
      key: 'status',
      header: tStatus('label'),
      align: 'right',
      cell: (b) => <ExpiryBadge expiryDate={b.expiryDate} />,
    },
    // The unknown lot's escape hatch. Without it that stock never gets a date,
    // never alerts, and sorts last in FEFO forever.
    ...(canManageStock
      ? [
          {
            key: 'assign',
            header: '',
            align: 'right',
            cell: (b) =>
              isUnknownExpiry(b) && b.remainingQuantity > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => setAssigning(b)}>
                  {tBatch('assignExpiry')}
                </Button>
              ) : null,
          } satisfies SimpleColumn<BatchRow>,
        ]
      : []),
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-amber-600" />
          {t('batchesTitle', { count: batches.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable columns={columns} rows={shown} getRowKey={(b) => b._id} />

        {hasMore && (
          <div className="mt-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? (
                <>
                  {t('showLess')}
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  {t('showAll', { count: batches.length })}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        )}

        {assigning && (
          <AssignExpiryDialog
            batch={assigning}
            open
            onOpenChange={(next) => !next && setAssigning(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
