'use client'
// coding-standard: maintained

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Layers, TrendingDown, Trophy } from 'lucide-react'
import { useSalesBreakdown } from '@/services/api'
import type {
  ReportParams,
  SalesBreakdownDimension,
} from '@/services/api/modules/reports/api'
import { splitBreakdown, type BreakdownMetric, type RankedRow } from '@/utils/sales-breakdown'
import { Button } from '@ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import EmptyState from '@ui/components/EmptyState'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { Skeleton } from '@ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@ui/components/tabs'
import { SalesBreakdownList } from './sales-breakdown-list'

const DIMENSIONS: SalesBreakdownDimension[] = ['category', 'brand', 'tag']
const METRICS: BreakdownMetric[] = ['revenue', 'units', 'orders']

/**
 * Sales by category, brand or tag — which groups sell the most and which the least.
 *
 * The server nets returns and ranks by revenue, and lists groups that sold nothing, so the
 * lowest sellers are real. This card only re-orders for "Rank by" and splits the one list.
 */
export function SalesBreakdownCard({
  params,
  formatCurrency,
}: {
  params?: ReportParams
  formatCurrency: (n: number) => string
}) {
  const t = useTranslations('reports.sales.breakdown')
  const [dimension, setDimension] = useState<SalesBreakdownDimension>('category')
  const [metric, setMetric] = useState<BreakdownMetric>('revenue')
  const [showAll, setShowAll] = useState(false)
  const { data, isLoading } = useSalesBreakdown(dimension, params)

  const split = useMemo(() => splitBreakdown(data?.rows ?? [], metric), [data, metric])
  const maxValue = split.ranked[0]?.row[metric] ?? 0
  const soldNothing =
    !data ||
    (data.totals.orders === 0 && data.totals.units === 0 && data.totals.revenue === 0)
  const unassigned = data?.unassigned

  const columns: SimpleColumn<RankedRow>[] = [
    { key: 'rank', header: '#', cell: (r) => r.rank },
    { key: 'name', header: t(`dimensions.${dimension}`), cell: (r) => r.row.name ?? t('deleted') },
    { key: 'units', header: t('metrics.units'), align: 'right', cell: (r) => r.row.units },
    { key: 'orders', header: t('metrics.orders'), align: 'right', cell: (r) => r.row.orders },
    {
      key: 'revenue',
      header: t('metrics.revenue'),
      align: 'right',
      cell: (r) => formatCurrency(r.row.revenue),
    },
    { key: 'share', header: t('colShare'), align: 'right', cell: (r) => `${r.row.share}%` },
  ]

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Tabs
            value={dimension}
            onValueChange={(v) => {
              setDimension(v as SalesBreakdownDimension)
              setShowAll(false)
            }}
          >
            <TabsList aria-label={t('groupBy')}>
              {DIMENSIONS.map((d) => (
                <TabsTrigger key={d} value={d}>
                  {t(`dimensions.${d}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2">
            <span className="whitespace-nowrap text-xs text-muted-foreground">{t('rankBy')}</span>
            <Tabs value={metric} onValueChange={(v) => setMetric(v as BreakdownMetric)}>
              <TabsList aria-label={t('rankBy')}>
                {METRICS.map((m) => (
                  <TabsTrigger key={m} value={m}>
                    {t(`metrics.${m}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : soldNothing ? (
          <EmptyState
            icon={Layers}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            compact
          />
        ) : (
          <>
            {split.ranked.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noGroups', { dimension })}</p>
            ) : showAll ? (
              <SimpleTable columns={columns} rows={split.ranked} getRowKey={(r) => r.row.id} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <SalesBreakdownList
                  title={t('top')}
                  icon={Trophy}
                  items={split.top}
                  metric={metric}
                  maxValue={maxValue}
                  tone="top"
                  formatCurrency={formatCurrency}
                />
                {split.bottom.length > 0 && (
                  <SalesBreakdownList
                    title={t('lowest')}
                    icon={TrendingDown}
                    items={split.bottom}
                    metric={metric}
                    maxValue={maxValue}
                    tone="low"
                    formatCurrency={formatCurrency}
                  />
                )}
              </div>
            )}

            {split.ranked.length > split.top.length + split.bottom.length || showAll ? (
              <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
                {showAll ? t('showLess') : t('showAll', { count: split.ranked.length })}
              </Button>
            ) : null}

            <div className="space-y-1 text-xs text-muted-foreground">
              {unassigned && (unassigned.units !== 0 || unassigned.revenue !== 0) && (
                <p>
                  {t('unassigned', {
                    dimension,
                    amount: formatCurrency(unassigned.revenue),
                    units: unassigned.units,
                  })}
                </p>
              )}
              {data?.overlapping && <p>{t('overlapNote')}</p>}
              <p>{t('basisNote')}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
